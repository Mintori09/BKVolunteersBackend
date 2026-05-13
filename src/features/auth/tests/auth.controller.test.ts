import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import type { NextFunction } from 'express'
import { HttpStatus } from 'src/common/constants'
import * as authService from '../auth.service'
import {
    handleLogin,
    getMe,
    handleChangePassword,
} from '../auth.controller'

jest.mock('src/config', () => ({
    prismaClient: {},
    config: {
        jwt: {
            access_token: { secret: 'test-secret', expire: '15m', cookie_name: 'accessToken' },
            refresh_token: { secret: 'test-secret', expire: '7d', cookie_name: 'min' },
        },
        frontend: { url: 'http://localhost:5173' },
    },
    refreshTokenCookieConfig: {},
    clearRefreshTokenCookieConfig: {},
}))

jest.mock('argon2', () => ({
    verify: jest.fn().mockResolvedValue(true),
}))

jest.mock('../auth.service')

const mockOperator = {
    id: '1',
    password: '$argon2id$v=19$m=65536,t=3,p=4$FakeHashValue',
    fullName: 'Test User',
    email: 'test@test.com',
    role: 'DOANTRUONG' as const,
    facultyId: null,
    organizationId: '1',
}

const mockStudent = {
    id: '2',
    password: '$argon2id$v=19$m=65536,t=3,p=4$FakeHashValue',
    fullName: 'Nguyen Van A',
    email: '102210001@sv1.dut.udn.vn',
    studentCode: '102210001',
    facultyId: '1',
}

describe('auth.controller', () => {
    let req: any
    let res: any
    let next: NextFunction

    beforeEach(() => {
        req = { body: {}, cookies: {}, params: {}, headers: {} }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis(),
            sendStatus: jest.fn().mockReturnThis(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('handleLogin', () => {
        it('should return 400 if credentials are missing', async () => {
            req.body = {}

            await handleLogin(req as any, res as any, next)

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({ statusCode: HttpStatus.BAD_REQUEST })
            )
        })

        it('should return 401 for invalid credentials', async () => {
            req.body = { identifier: 'unknown', password: 'wrongpass' }
            ;(authService.getUserByIdentifier as jest.Mock).mockResolvedValue(null)

            await handleLogin(req as any, res as any, next)

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({ statusCode: HttpStatus.UNAUTHORIZED })
            )
        })

        it('should login successfully for operator', async () => {
            req.body = { identifier: 'admin@test.com', password: 'Password123' }
            ;(authService.getUserByIdentifier as jest.Mock).mockResolvedValue(mockOperator)
            ;(authService.getRefreshTokenByToken as jest.Mock).mockResolvedValue(null)
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'new-token',
                refreshToken: 'new-refresh',
            })

            await handleLogin(req as any, res as any, next)

            expect(authService.createSession).toHaveBeenCalledWith('1', 'DOANTRUONG')
            expect(res.cookie).toHaveBeenCalled()
        })

        it('should login successfully for student', async () => {
            req.body = { identifier: '102210001', password: '102210001' }
            ;(authService.getUserByIdentifier as jest.Mock).mockResolvedValue(mockStudent)
            ;(authService.getRefreshTokenByToken as jest.Mock).mockResolvedValue(null)
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'new-token',
                refreshToken: 'new-refresh',
            })

            await handleLogin(req as any, res as any, next)

            expect(authService.createSession).toHaveBeenCalledWith('2', 'SINHVIEN')
        })
    })

    describe('getMe', () => {
        it('should return 401 if no userId in payload', async () => {
            req.payload = {}

            await getMe(req as any, res as any, next)

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({ statusCode: HttpStatus.UNAUTHORIZED })
            )
        })

        it('should return user profile for operator', async () => {
            req.payload = { userId: '1', role: 'DOANTRUONG', accountType: 'OPERATOR' }
            const mockOperator = {
                id: '1',
                fullName: 'School Admin',
                email: 'admin@dut.udn.vn',
                role: 'DOANTRUONG',
                organization: { id: 1n, name: 'School', type: 'school' },
                faculty: null,
            }
            ;(authService.getUserByPrincipal as jest.Mock).mockResolvedValue(mockOperator)

            await getMe(req as any, res as any, next)

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        account_type: 'OPERATOR',
                        role: 'DOANTRUONG',
                        operator: expect.objectContaining({ full_name: 'School Admin' }),
                    }),
                })
            )
        })

        it('should return user profile for student', async () => {
            req.payload = { userId: '2', role: 'SINHVIEN', accountType: 'STUDENT' }
            const mockStudent = {
                id: '2',
                fullName: 'Nguyen Van A',
                email: '102210001@sv1.dut.udn.vn',
                studentCode: '102210001',
                classCode: '22TCLC1',
                faculty: { id: 1n, code: '102', name: 'CNTT' },
                organization: null,
            }
            ;(authService.getUserByPrincipal as jest.Mock).mockResolvedValue(mockStudent)

            await getMe(req as any, res as any, next)

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        account_type: 'STUDENT',
                        role: 'SINHVIEN',
                        student: expect.objectContaining({ student_code: '102210001' }),
                    }),
                })
            )
        })
    })

    describe('handleChangePassword', () => {
        it('should return 401 if not authenticated', async () => {
            req.payload = {}

            await handleChangePassword(req as any, res as any, next)

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({ statusCode: HttpStatus.UNAUTHORIZED })
            )
        })

        it('should change password successfully', async () => {
            req.payload = { userId: '1', role: 'DOANTRUONG' }
            req.body = {
                oldPassword: 'oldpass123',
                newPassword: 'newpass123',
                newPasswordConfirm: 'newpass123',
            }
            ;(authService.changePassword as jest.Mock).mockResolvedValue(undefined)

            await handleChangePassword(req as any, res as any, next)

            expect(authService.changePassword).toHaveBeenCalledWith('1', 'DOANTRUONG', req.body)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Đổi mật khẩu thành công' })
            )
        })
    })
})
