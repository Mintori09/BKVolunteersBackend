import { HttpStatus } from 'src/common/constants'
import {
    handleLogin,
    handleLogout,
    handleRefresh,
    handleChangePassword,
    getMe,
    updateMe,
} from 'src/features/auth/auth.controller'
import * as argon2 from 'argon2'
import { NextFunction } from 'express'
import * as authService from '../auth.service'
import { ApiError } from 'src/utils/ApiError'
import { UserRole } from '../types'

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

jest.mock('argon2')
jest.mock('node:crypto')
jest.mock('src/utils/sendEmail.util')
jest.mock('src/utils/generateTokens.util')
jest.mock('jsonwebtoken')
jest.mock('../auth.service')

const buildActiveUser = (role: UserRole = 'LCD') => ({
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role,
    facultyId: null,
    status: 'ACTIVE' as const,
    passwordHash: 'hashed',
    createdAt: new Date(),
    updatedAt: new Date(),
})

const buildActiveStudent = () => ({
    id: '1',
    username: '123456789',
    mssv: '123456789',
    fullName: 'Sinh Vien',
    email: 'student@example.com',
    firstName: 'Sinh',
    lastName: 'Vien',
    role: 'SINHVIEN' as const,
    facultyId: null,
    status: 'ACTIVE' as const,
    passwordHash: 'hashed',
    className: null,
    phone: null,
    totalPoints: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
})

describe('Auth Controller', () => {
    let req: any
    let res: any
    let next: NextFunction

    beforeEach(() => {
        req = {
            body: {},
            cookies: {},
            params: {},
            payload: undefined,
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            sendStatus: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('handleLogin', () => {
        it('returns BAD_REQUEST when username is missing', async () => {
            req.body = { password: 'password' }
            await handleLogin(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.BAD_REQUEST
            )
        })

        it('returns UNAUTHORIZED when user does not exist', async () => {
            req.body = { username: 'testuser', password: 'password' }
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(null)

            await handleLogin(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('returns FORBIDDEN when account status is not ACTIVE', async () => {
            req.body = { username: 'testuser', password: 'password' }
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue({ ...buildActiveUser(), status: 'LOCKED' })

            await handleLogin(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.FORBIDDEN
            )
        })

        it('returns UNAUTHORIZED when password is invalid', async () => {
            req.body = { username: 'testuser', password: 'wrong-password' }
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(buildActiveUser())
            ;(argon2.verify as jest.Mock).mockResolvedValue(false)

            await handleLogin(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('creates session and returns accessToken + user', async () => {
            req.body = { username: 'testuser', password: 'password' }
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(buildActiveUser())
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'access',
                refreshToken: 'refresh',
            })
            ;(authService.updateLastLoginAt as jest.Mock).mockResolvedValue(
                undefined
            )

            await handleLogin(req, res, next)

            expect(authService.createSession).toHaveBeenCalledWith('1', 'LCD')
            expect(authService.updateLastLoginAt).toHaveBeenCalledWith('1')
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        accessToken: 'access',
                    }),
                })
            )
            expect(res.cookie).toHaveBeenCalled()
        })

        it('deletes old refresh token when cookie belongs to same user', async () => {
            req.body = { username: 'testuser', password: 'password' }
            req.cookies = { refresh_token: 'old-refresh-token' }
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(buildActiveUser())
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue({
                token: 'old-refresh-token',
                userId: '1',
            })
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'access',
                refreshToken: 'refresh',
            })

            await handleLogin(req, res, next)

            expect(authService.deleteRefreshToken).toHaveBeenCalledWith(
                'old-refresh-token'
            )
            expect(res.clearCookie).toHaveBeenCalled()
        })

        it('deletes all refresh tokens when cookie token belongs to another user', async () => {
            req.body = { username: 'testuser', password: 'password' }
            req.cookies = { refresh_token: 'old-refresh-token' }
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(buildActiveUser())
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue({
                token: 'old-refresh-token',
                userId: '2',
            })
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'access',
                refreshToken: 'refresh',
            })

            await handleLogin(req, res, next)

            expect(authService.deleteAllUserRefreshTokens).toHaveBeenCalledWith(
                '1'
            )
        })

        it('creates session for student role', async () => {
            req.body = { username: '123456789', password: 'password' }
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(buildActiveStudent())
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'access',
                refreshToken: 'refresh',
            })
            ;(authService.updateLastLoginAt as jest.Mock).mockResolvedValue(
                undefined
            )

            await handleLogin(req, res, next)

            expect(authService.createSession).toHaveBeenCalledWith(
                '1',
                'SINHVIEN'
            )
        })
    })

    describe('handleLogout', () => {
        it('returns 204 if no refresh token in cookies', async () => {
            await handleLogout(req, res, next)
            expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.NO_CONTENT)
        })

        it('deletes refresh token if token exists', async () => {
            req.cookies = { refresh_token: 'token' }
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue({ token: 'token', userId: '1' })

            await handleLogout(req, res, next)

            expect(authService.deleteRefreshToken).toHaveBeenCalledWith('token')
            expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.NO_CONTENT)
        })
    })

    describe('handleRefresh', () => {
        it('returns UNAUTHORIZED when refresh token is missing', async () => {
            await handleRefresh(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('revokes all tokens and returns FORBIDDEN when token not found in DB', async () => {
            req.cookies = { refresh_token: 'token' }
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue(null)
            ;(authService.verifyToken as jest.Mock).mockResolvedValue({
                userId: '1',
                role: 'LCD',
            })

            await handleRefresh(req, res, next)

            expect(authService.deleteAllUserRefreshTokens).toHaveBeenCalledWith(
                '1'
            )
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.FORBIDDEN
            )
        })

        it('creates new session when refresh token is valid', async () => {
            req.cookies = { refresh_token: 'token' }
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue({ token: 'token', userId: '1' })
            ;(authService.verifyToken as jest.Mock).mockResolvedValue({
                userId: '1',
                role: 'LCD',
            })
            ;(authService.getUserById as jest.Mock).mockResolvedValue(
                buildActiveUser()
            )
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'new-access',
                refreshToken: 'new-refresh',
            })

            await handleRefresh(req, res, next)

            expect(authService.deleteRefreshToken).toHaveBeenCalledWith('token')
            expect(authService.createSession).toHaveBeenCalledWith('1', 'LCD')
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        accessToken: 'new-access',
                    }),
                })
            )
        })
    })

    describe('getMe', () => {
        it('returns UNAUTHORIZED if payload is missing', async () => {
            req.payload = {}

            await getMe(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('returns user profile when authenticated', async () => {
            req.payload = { userId: '1', role: 'LCD' }
            ;(authService.getUserById as jest.Mock).mockResolvedValue(
                buildActiveUser()
            )

            await getMe(req, res, next)

            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        id: '1',
                        username: 'testuser',
                    }),
                })
            )
        })
    })

    describe('handleChangePassword', () => {
        it('returns UNAUTHORIZED when payload is missing', async () => {
            req.payload = null
            await handleChangePassword(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('calls changePassword and returns success', async () => {
            req.payload = { userId: '1', role: 'LCD' }
            req.body = {
                oldPassword: 'old_password',
                newPassword: 'new_password',
                newPasswordConfirm: 'new_password',
            }
            ;(authService.changePassword as jest.Mock).mockResolvedValue(
                undefined
            )

            await handleChangePassword(req, res, next)

            expect(authService.changePassword).toHaveBeenCalledWith(
                '1',
                'LCD',
                req.body
            )
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Doi mat khau thanh cong',
                })
            )
        })
    })

    describe('updateMe', () => {
        it('returns UNAUTHORIZED when payload is missing', async () => {
            req.payload = null

            await updateMe(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('calls updateProfile and returns updated user', async () => {
            req.payload = { userId: '1', role: 'SINHVIEN' }
            req.body = {
                email: 'student@example.com',
                fullName: 'Sinh Vien Moi',
                phone: '0901234567',
            }
            ;(authService.updateProfile as jest.Mock).mockResolvedValue({
                ...buildActiveStudent(),
                fullName: 'Sinh Vien Moi',
                phone: '0901234567',
            })

            await updateMe(req, res, next)

            expect(authService.updateProfile).toHaveBeenCalledWith(
                '1',
                'SINHVIEN',
                req.body
            )
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Cap nhat ho so thanh cong',
                    data: expect.objectContaining({
                        fullName: 'Sinh Vien Moi',
                        phone: '0901234567',
                    }),
                })
            )
        })
    })
})
