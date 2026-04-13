import * as authService from '../auth.service'
import * as authRepository from '../auth.repository'
import * as argon2 from 'argon2'
import * as bcrypt from 'bcryptjs'
import { StudentAccountStatus } from '@prisma/client'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'

jest.mock('src/config', () => ({
    prismaClient: {},
    config: {
        node_env: 'test',
        jwt: {
            refresh_token: {
                cookie_name: 'refresh_token',
                secret: 'secret',
            },
            access_token: {
                secret: 'secret',
            },
        },
        email: {
            smtp: {
                host: 'localhost',
                port: '587',
                auth: {
                    username: 'test_user',
                },
            },
        },
    },
    refreshTokenCookieConfig: {},
    clearRefreshTokenCookieConfig: {},
}))

jest.mock('../auth.repository')
jest.mock('argon2', () => ({
    hash: jest.fn(),
    verify: jest.fn(),
}))
jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
}))
jest.mock('node:crypto', () => ({
    randomUUID: jest.fn(() => 'token-123'),
}))
jest.mock('src/utils/sendEmail.util')
jest.mock('src/utils/generateTokens.util')

describe('Auth Service', () => {
    describe('verifyStudentPassword', () => {
        it('should allow login when password matches MSSV', () => {
            expect(
                authService.verifyStudentPassword(
                    {
                        mssv: '102220001',
                    } as any,
                    '102220001'
                )
            ).toBe(true)
        })

        it('should reject when password does not match MSSV', () => {
            expect(() =>
                authService.verifyStudentPassword(
                    {
                        mssv: '102220001',
                    } as any,
                    'wrong-password'
                )
            ).toThrow(
                new ApiError(
                    HttpStatus.UNAUTHORIZED,
                    'Invalid username or password'
                )
            )
        })
    })

    describe('ensureStudentActive', () => {
        const baseStudent = {
            id: 'student-1',
            mssv: '102220001',
            email: 'student@sv1.dut.udn.vn',
            fullName: 'Nguyen Van A',
        } as const

        it('should allow ACTIVE student accounts', () => {
            expect(
                authService.ensureStudentActive({
                    ...baseStudent,
                    status: StudentAccountStatus.ACTIVE,
                } as any)
            ).toEqual(
                expect.objectContaining({
                    status: StudentAccountStatus.ACTIVE,
                })
            )
        })

        it('should reject LOCKED student accounts', () => {
            expect(() =>
                authService.ensureStudentActive({
                    ...baseStudent,
                    status: StudentAccountStatus.LOCKED,
                } as any)
            ).toThrow(
                new ApiError(
                    HttpStatus.FORBIDDEN,
                    'Student account is locked'
                )
            )
        })
    })

    describe('ensureManagerActive', () => {
        it('should allow ACTIVE manager accounts', () => {
            expect(
                authService.ensureManagerActive({
                    status: 'ACTIVE',
                } as any)
            ).toEqual(
                expect.objectContaining({
                    status: 'ACTIVE',
                })
            )
        })

        it('should reject LOCKED manager accounts with the backlog error code', () => {
            expect(() =>
                authService.ensureManagerActive({
                    status: 'LOCKED',
                } as any)
            ).toThrow(
                new ApiError(
                    HttpStatus.FORBIDDEN,
                    'Manager account is locked',
                    true,
                    {
                        code: 'ERR_MANAGER_ACCOUNT_LOCKED',
                    }
                )
            )
        })
    })

    describe('ensureManagerContext', () => {
        it('should reject LCD manager accounts without faculty context', () => {
            expect(() =>
                authService.ensureManagerContext({
                    roleType: 'LCD_MANAGER',
                    facultyId: null,
                    faculty: null,
                    clubId: null,
                    club: null,
                } as any)
            ).toThrow(
                new ApiError(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    'Manager account context is invalid',
                    true,
                    {
                        code: 'ERR_MANAGER_CONTEXT_INVALID',
                    }
                )
            )
        })
    })

    describe('verifyManagerPassword', () => {
        beforeEach(() => {
            jest.clearAllMocks()
        })

        it('should allow manager login when bcrypt password matches', async () => {
            ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

            await expect(
                authService.verifyManagerPassword(
                    {
                        passwordHash: 'hashed-password',
                    } as any,
                    'QL@123456'
                )
            ).resolves.toBe(true)
        })

        it('should reject when manager password is invalid', async () => {
            ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

            await expect(
                authService.verifyManagerPassword(
                    {
                        passwordHash: 'hashed-password',
                    } as any,
                    'wrong-password'
                )
            ).rejects.toThrow(
                new ApiError(
                    HttpStatus.UNAUTHORIZED,
                    'Invalid manager credentials',
                    true,
                    {
                        code: 'ERR_INVALID_MANAGER_CREDENTIALS',
                    }
                )
            )
        })
    })

    describe('changePassword', () => {
        const userId = 'user-1'
        const changePasswordData = {
            oldPassword: 'old-password',
            newPassword: 'new-password',
            newPasswordConfirm: 'new-password',
        }

        beforeEach(() => {
            jest.clearAllMocks()
        })

        it('should throw ApiError if user is not found', async () => {
            ;(authRepository.getUserById as jest.Mock).mockResolvedValue(null)

            await expect(
                authService.changePassword(userId, changePasswordData)
            ).rejects.toThrow(
                new ApiError(HttpStatus.NOT_FOUND, 'User not found')
            )
        })

        it('should throw ApiError if old password is invalid', async () => {
            const user = { id: userId, password: 'hashed-old-password' }
            ;(authRepository.getUserById as jest.Mock).mockResolvedValue(user)
            ;(argon2.verify as jest.Mock).mockResolvedValue(false)

            await expect(
                authService.changePassword(userId, changePasswordData)
            ).rejects.toThrow(
                new ApiError(HttpStatus.UNAUTHORIZED, 'Invalid old password')
            )
        })

        it('should update password if old password is valid', async () => {
            const user = { id: userId, password: 'hashed-old-password' }
            ;(authRepository.getUserById as jest.Mock).mockResolvedValue(user)
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(argon2.hash as jest.Mock).mockResolvedValue('hashed-new-password')

            await authService.changePassword(userId, changePasswordData)

            expect(argon2.verify).toHaveBeenCalledWith(
                'hashed-old-password',
                changePasswordData.oldPassword
            )
            expect(argon2.hash).toHaveBeenCalledWith(
                changePasswordData.newPassword
            )
            expect(authRepository.updatePassword).toHaveBeenCalledWith(
                userId,
                'hashed-new-password'
            )
        })
    })
})
