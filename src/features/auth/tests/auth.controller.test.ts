import * as argon2 from 'argon2'
import { NextFunction } from 'express'
import { HttpStatus } from 'src/common/constants'
import {
    handleLogin,
    handleManagerLogin,
    handleRefresh,
} from 'src/features/auth/auth.controller'
import * as authService from '../auth.service'
import { ApiError } from 'src/utils/ApiError'

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
    },
    refreshTokenCookieConfig: {},
    clearRefreshTokenCookieConfig: {},
}))

jest.mock('argon2', () => ({
    hash: jest.fn(),
    verify: jest.fn(),
}))
jest.mock('src/utils/sendEmail.util')
jest.mock('src/utils/generateTokens.util')
jest.mock('jsonwebtoken')
jest.mock('../auth.service')

describe('Auth Controller', () => {
    let req: any
    let res: any
    let next: NextFunction

    beforeEach(() => {
        req = {
            body: {},
            cookies: {},
            params: {},
            query: {},
        }
        res = {
            status: jest.fn().mockReturnThis(),
            type: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            sendStatus: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis(),
            redirect: jest.fn().mockReturnThis(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('handleLogin', () => {
        it('should call next with ApiError if username does not exist', async () => {
            req.body = { username: 'unknown', password: 'password' }
            ;(authService.getUserByUsername as jest.Mock).mockResolvedValue(null)
            ;(
                authService.getManagerByIdentifier as jest.Mock
            ).mockResolvedValue(null)
            ;(authService.getStudentByMssv as jest.Mock).mockResolvedValue(null)

            await handleLogin(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should login a manager account from the shared regular login endpoint', async () => {
            req.body = { username: 'lcd_cntt', password: 'QL@123456' }

            ;(authService.getUserByUsername as jest.Mock).mockResolvedValue(null)
            ;(
                authService.getManagerByIdentifier as jest.Mock
            ).mockResolvedValue({
                id: 'manager-1',
                username: 'lcd_cntt',
                roleType: 'LCD_MANAGER',
                facultyId: 102,
                faculty: {
                    id: 102,
                    code: '102',
                    name: 'Khoa Cong nghe thong tin',
                },
                clubId: null,
                club: null,
                status: 'ACTIVE',
            })
            ;(authService.ensureManagerActive as jest.Mock).mockReturnValue(true)
            ;(authService.ensureManagerContext as jest.Mock).mockReturnValue({
                dashboardType: 'faculty',
                scopeName: 'Khoa Cong nghe thong tin',
            })
            ;(authService.verifyManagerPassword as jest.Mock).mockResolvedValue(
                true
            )
            ;(authService.createManagerSession as jest.Mock).mockResolvedValue({
                accessToken: 'manager-access',
                refreshToken: 'manager-refresh',
            })
            ;(authService.buildSessionUser as jest.Mock).mockResolvedValue({
                id: 'manager-1',
                role: 'ADMIN',
                accountType: 'manager',
                roleType: 'LCD_MANAGER',
            })

            await handleLogin(req, res, next)

            expect(authService.getStudentByMssv).not.toHaveBeenCalled()
            expect(res.cookie).toHaveBeenCalled()
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: {
                        accessToken: 'manager-access',
                        user: expect.objectContaining({
                            accountType: 'manager',
                            roleType: 'LCD_MANAGER',
                        }),
                    },
                })
            )
        })

        it('should login a manager account and return access token with session user', async () => {
            req.body = { username: 'lcd_club', password: 'password' }
            const user = {
                id: '1',
                password: 'hashed',
                emailVerified: new Date(),
                role: 'USER',
            }

            ;(authService.getUserByUsername as jest.Mock).mockResolvedValue(user)
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'access',
                refreshToken: 'refresh',
            })
            ;(authService.buildSessionUser as jest.Mock).mockResolvedValue({
                id: '1',
                username: 'lcd_club',
                role: 'USER',
            })

            await handleLogin(req, res, next)

            expect(res.cookie).toHaveBeenCalled()
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: {
                        accessToken: 'access',
                        user: expect.objectContaining({
                            id: '1',
                            role: 'USER',
                        }),
                    },
                })
            )
        })

        it('should login a student account using MSSV for both username and password', async () => {
            req.body = { username: '102220001', password: '102220001' }
            const student = {
                id: 'student-1',
                mssv: '102220001',
                status: 'ACTIVE',
            }

            ;(authService.getUserByUsername as jest.Mock).mockResolvedValue(null)
            ;(
                authService.getManagerByIdentifier as jest.Mock
            ).mockResolvedValue(null)
            ;(authService.getStudentByMssv as jest.Mock).mockResolvedValue(
                student
            )
            ;(authService.ensureStudentActive as jest.Mock).mockReturnValue(
                student
            )
            ;(authService.verifyStudentPassword as jest.Mock).mockReturnValue(
                true
            )
            ;(authService.createStudentSession as jest.Mock).mockResolvedValue({
                accessToken: 'student-access',
                refreshToken: 'student-refresh',
            })
            ;(authService.buildSessionUser as jest.Mock).mockResolvedValue({
                id: 'student-1',
                username: '102220001',
                role: 'STUDENT',
            })

            await handleLogin(req, res, next)

            expect(res.cookie).toHaveBeenCalled()
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: {
                        accessToken: 'student-access',
                        user: expect.objectContaining({
                            role: 'STUDENT',
                        }),
                    },
                })
            )
        })
    })

    describe('handleManagerLogin', () => {
        it('should login a manager account with identifier and return scoped session user', async () => {
            req.body = { identifier: 'lcd_cntt', password: 'QL@123456' }
            const manager = {
                id: 'manager-1',
                username: 'lcd_cntt',
                passwordHash: 'hashed',
                roleType: 'LCD_MANAGER',
                facultyId: 102,
                faculty: {
                    id: 102,
                    code: '102',
                    name: 'Khoa Cong nghe thong tin',
                },
                clubId: null,
                club: null,
                status: 'ACTIVE',
            }

            ;(
                authService.getManagerByIdentifier as jest.Mock
            ).mockResolvedValue(manager)
            ;(authService.ensureManagerActive as jest.Mock).mockReturnValue(
                manager
            )
            ;(authService.ensureManagerContext as jest.Mock).mockReturnValue({
                dashboardType: 'faculty',
                scopeName: 'Khoa Cong nghe thong tin',
            })
            ;(authService.verifyManagerPassword as jest.Mock).mockResolvedValue(
                true
            )
            ;(authService.createManagerSession as jest.Mock).mockResolvedValue({
                accessToken: 'manager-access',
                refreshToken: 'manager-refresh',
            })
            ;(authService.buildSessionUser as jest.Mock).mockResolvedValue({
                id: 'manager-1',
                username: 'lcd_cntt',
                role: 'ADMIN',
                accountType: 'manager',
                roleType: 'LCD_MANAGER',
            })

            await handleManagerLogin(req, res, next)

            expect(res.cookie).toHaveBeenCalled()
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: {
                        accessToken: 'manager-access',
                        user: expect.objectContaining({
                            accountType: 'manager',
                            roleType: 'LCD_MANAGER',
                        }),
                    },
                })
            )
        })
    })

    describe('handleRefresh', () => {
        it('should create a new student session when student refresh token is valid', async () => {
            req.cookies = { refresh_token: 'student-token' }
            const payload = {
                userId: 'student-1',
                role: 'STUDENT',
                subjectType: 'student',
            }

            ;(authService.getRefreshTokenByToken as jest.Mock).mockResolvedValue(
                null
            )
            ;(
                authService.getStudentRefreshTokenByToken as jest.Mock
            ).mockResolvedValue({
                token: 'student-token',
                studentId: 'student-1',
            })
            ;(authService.verifyToken as jest.Mock).mockResolvedValue(payload)
            ;(authService.getStudentById as jest.Mock).mockResolvedValue({
                id: 'student-1',
                status: 'ACTIVE',
            })
            ;(authService.ensureStudentActive as jest.Mock).mockReturnValue(
                true
            )
            ;(authService.createStudentSession as jest.Mock).mockResolvedValue({
                accessToken: 'student-access',
                refreshToken: 'student-refresh',
            })
            ;(authService.buildSessionUser as jest.Mock).mockResolvedValue({
                id: 'student-1',
                role: 'STUDENT',
            })

            await handleRefresh(req, res, next)

            expect(res.cookie).toHaveBeenCalled()
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: {
                        accessToken: 'student-access',
                        user: expect.objectContaining({
                            role: 'STUDENT',
                        }),
                    },
                })
            )
        })

        it('should refresh a manager session without using the student refresh flow', async () => {
            req.cookies = { refresh_token: 'manager-token' }
            const payload = {
                userId: 'manager-1',
                role: 'ADMIN',
                subjectType: 'manager',
                roleType: 'LCD_MANAGER',
                facultyId: 102,
                clubId: null,
            }

            ;(authService.getRefreshTokenByToken as jest.Mock).mockResolvedValue(
                null
            )
            ;(
                authService.getStudentRefreshTokenByToken as jest.Mock
            ).mockResolvedValue(null)
            ;(authService.verifyToken as jest.Mock).mockResolvedValue(payload)
            ;(authService.getManagerById as jest.Mock).mockResolvedValue({
                id: 'manager-1',
                username: 'lcd_cntt',
                roleType: 'LCD_MANAGER',
                facultyId: 102,
                faculty: {
                    id: 102,
                    code: '102',
                    name: 'Khoa Cong nghe thong tin',
                },
                clubId: null,
                club: null,
                status: 'ACTIVE',
            })
            ;(authService.ensureManagerActive as jest.Mock).mockReturnValue(
                true
            )
            ;(authService.ensureManagerContext as jest.Mock).mockReturnValue({
                dashboardType: 'faculty',
                scopeName: 'Khoa Cong nghe thong tin',
            })
            ;(authService.createManagerSession as jest.Mock).mockResolvedValue({
                accessToken: 'manager-access',
                refreshToken: 'manager-refresh',
            })
            ;(authService.buildSessionUser as jest.Mock).mockResolvedValue({
                id: 'manager-1',
                role: 'ADMIN',
                accountType: 'manager',
                roleType: 'LCD_MANAGER',
            })

            await handleRefresh(req, res, next)

            expect(authService.getStudentById).not.toHaveBeenCalled()
            expect(res.cookie).toHaveBeenCalled()
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: {
                        accessToken: 'manager-access',
                        user: expect.objectContaining({
                            accountType: 'manager',
                            roleType: 'LCD_MANAGER',
                        }),
                    },
                })
            )
        })
    })
})
