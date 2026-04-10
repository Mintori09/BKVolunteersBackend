import { HttpStatus } from 'src/common/constants'
import {
    handleLogin,
    handleLogout,
    handleRefresh,
    handleChangePassword,
    getMe,
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
        it('should call next with ApiError if username is missing', async () => {
            req.body = { password: 'password' }

            await handleLogin(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.BAD_REQUEST
            )
        })

        it('should call next with ApiError if password is missing', async () => {
            req.body = { username: 'testuser' }

            await handleLogin(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.BAD_REQUEST
            )
        })

        it('should call next with ApiError if user does not exist', async () => {
            req.body = { username: 'testuser', password: 'password' }
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(null)

            await handleLogin(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
            expect((next as jest.Mock).mock.calls[0][0].message).toBe(
                'Email hoặc mật khẩu không hợp lệ'
            )
        })

        it('should call next with ApiError if password is invalid', async () => {
            req.body = { username: 'testuser', password: 'wrong-password' }
            const user = {
                id: '1',
                password: 'hashed',
                role: 'LCD' as UserRole,
            }
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(user)
            ;(argon2.verify as jest.Mock).mockResolvedValue(false)

            await handleLogin(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
            expect((next as jest.Mock).mock.calls[0][0].message).toBe(
                'Email hoặc mật khẩu không hợp lệ'
            )
        })

        it('should login and return tokens if credentials are valid', async () => {
            req.body = { username: 'testuser', password: 'password' }
            const user = {
                id: '1',
                password: 'hashed',
                role: 'LCD' as UserRole,
            }
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(user)
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'access',
                refreshToken: 'refresh',
            })

            await handleLogin(req, res, next)

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: { accessToken: 'access' },
                })
            )
            expect(res.cookie).toHaveBeenCalled()
        })

        it('should login student with SINHVIEN role', async () => {
            req.body = { username: '123456789', password: 'password' }
            const student = {
                id: '1',
                password: 'hashed',
                mssv: '123456789',
            }
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(student)
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'access',
                refreshToken: 'refresh',
            })

            await handleLogin(req, res, next)

            expect(authService.createSession).toHaveBeenCalledWith(
                '1',
                'SINHVIEN'
            )
        })

        it('should delete existing refresh token if it belongs to same user', async () => {
            req.body = { username: 'testuser', password: 'password' }
            req.cookies = { refresh_token: 'old-refresh-token' }
            const user = {
                id: '1',
                password: 'hashed',
                role: 'LCD' as UserRole,
            }
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(user)
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(authService.getRefreshTokenByToken as jest.Mock).mockResolvedValue({
                token: 'old-refresh-token',
                userId: '1',
                userType: 'user',
            })
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'access',
                refreshToken: 'refresh',
            })

            await handleLogin(req, res, next)

            expect(authService.deleteRefreshToken).toHaveBeenCalledWith(
                'old-refresh-token',
                'LCD'
            )
            expect(res.clearCookie).toHaveBeenCalled()
        })

        it('should delete all user refresh tokens if existing token belongs to different user', async () => {
            req.body = { username: 'testuser', password: 'password' }
            req.cookies = { refresh_token: 'old-refresh-token' }
            const user = {
                id: '1',
                password: 'hashed',
                role: 'LCD' as UserRole,
            }
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(user)
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(authService.getRefreshTokenByToken as jest.Mock).mockResolvedValue({
                token: 'old-refresh-token',
                userId: '2',
                userType: 'user',
            })
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'access',
                refreshToken: 'refresh',
            })

            await handleLogin(req, res, next)

            expect(
                authService.deleteAllUserRefreshTokens
            ).toHaveBeenCalledWith('1', 'LCD')
        })

        it('should delete all user refresh tokens if existing token not found in DB', async () => {
            req.body = { username: 'testuser', password: 'password' }
            req.cookies = { refresh_token: 'old-refresh-token' }
            const user = {
                id: '1',
                password: 'hashed',
                role: 'LCD' as UserRole,
            }
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(user)
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(authService.getRefreshTokenByToken as jest.Mock).mockResolvedValue(
                null
            )
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'access',
                refreshToken: 'refresh',
            })

            await handleLogin(req, res, next)

            expect(
                authService.deleteAllUserRefreshTokens
            ).toHaveBeenCalledWith('1', 'LCD')
        })

        it('should handle student refresh token correctly', async () => {
            req.body = { username: '123456789', password: 'password' }
            req.cookies = { refresh_token: 'old-refresh-token' }
            const student = {
                id: '1',
                password: 'hashed',
                mssv: '123456789',
            }
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(student)
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(authService.getRefreshTokenByToken as jest.Mock).mockResolvedValue({
                token: 'old-refresh-token',
                studentId: '1',
                userType: 'student',
            })
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'access',
                refreshToken: 'refresh',
            })

            await handleLogin(req, res, next)

            expect(authService.deleteRefreshToken).toHaveBeenCalledWith(
                'old-refresh-token',
                'SINHVIEN'
            )
        })
    })

    describe('handleLogout', () => {
        it('should return 204 if no refresh token in cookies', async () => {
            await handleLogout(req, res, next)
            expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.NO_CONTENT)
        })

        it('should clear cookie and return 204 if token not found in DB', async () => {
            req.cookies = { refresh_token: 'token' }
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue(null)

            await handleLogout(req, res, next)

            expect(res.clearCookie).toHaveBeenCalled()
            expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.NO_CONTENT)
        })

        it('should delete token and clear cookie if token exists', async () => {
            req.cookies = { refresh_token: 'token' }
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue({ token: 'token', userId: '1' })

            await handleLogout(req, res, next)

            expect(authService.deleteRefreshToken).toHaveBeenCalledWith('token')
            expect(res.clearCookie).toHaveBeenCalled()
            expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.NO_CONTENT)
        })
    })

    describe('handleRefresh', () => {
        it('should call next with ApiError if no refresh token', async () => {
            await handleRefresh(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should call next with ApiError if token is not found in DB and delete all user tokens', async () => {
            req.cookies = { refresh_token: 'token' }
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue(null)
            ;(authService.verifyToken as jest.Mock).mockResolvedValue({
                userId: '1',
                role: 'LCD',
            })

            await handleRefresh(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.FORBIDDEN
            )
            expect(authService.deleteAllUserRefreshTokens).toHaveBeenCalledWith(
                '1',
                'LCD'
            )
        })

        it('should call next with ApiError if token is not found in DB and verify fails', async () => {
            req.cookies = { refresh_token: 'token' }
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue(null)
            ;(authService.verifyToken as jest.Mock).mockRejectedValue(
                new Error('invalid')
            )

            await handleRefresh(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.FORBIDDEN
            )
        })

        it('should call next with ApiError if userId does not match token', async () => {
            req.cookies = { refresh_token: 'token' }
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue({
                token: 'token',
                userId: '1',
                userType: 'user',
            })
            ;(authService.verifyToken as jest.Mock).mockResolvedValue({
                userId: '2',
                role: 'LCD',
            })

            await handleRefresh(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.FORBIDDEN
            )
        })

        it('should call next with ApiError if user not found', async () => {
            req.cookies = { refresh_token: 'token' }
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue({
                token: 'token',
                userId: '1',
                userType: 'user',
            })
            ;(authService.verifyToken as jest.Mock).mockResolvedValue({
                userId: '1',
                role: 'LCD',
            })
            ;(authService.getUserById as jest.Mock).mockResolvedValue(null)

            await handleRefresh(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.FORBIDDEN
            )
        })

        it('should create new session if refresh token is valid', async () => {
            req.cookies = { refresh_token: 'token' }
            const payload = { userId: '1', role: 'LCD' as UserRole }
            const user = { id: '1', role: 'LCD' }

            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue({
                token: 'token',
                userId: '1',
                userType: 'user',
            })
            ;(authService.verifyToken as jest.Mock).mockResolvedValue(payload)
            ;(authService.getUserById as jest.Mock).mockResolvedValue(user)
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'new_access',
                refreshToken: 'new_refresh',
            })

            await handleRefresh(req, res, next)

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: { accessToken: 'new_access' },
                })
            )
            expect(res.cookie).toHaveBeenCalled()
            expect(authService.deleteRefreshToken).toHaveBeenCalledWith('token')
        })

        it('should handle student refresh token correctly', async () => {
            req.cookies = { refresh_token: 'token' }
            const payload = { userId: '1', role: 'SINHVIEN' as UserRole }
            const student = { id: '1', mssv: '123456789' }

            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue({
                token: 'token',
                studentId: '1',
                userType: 'student',
            })
            ;(authService.verifyToken as jest.Mock).mockResolvedValue(payload)
            ;(authService.getUserById as jest.Mock).mockResolvedValue(student)
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'new_access',
                refreshToken: 'new_refresh',
            })

            await handleRefresh(req, res, next)

            expect(authService.createSession).toHaveBeenCalledWith(
                '1',
                'SINHVIEN'
            )
        })

        it('should call next with ApiError if verifyToken throws error', async () => {
            req.cookies = { refresh_token: 'token' }
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue({
                token: 'token',
                userId: '1',
                userType: 'user',
            })
            ;(authService.verifyToken as jest.Mock).mockRejectedValue(
                new Error('jwt expired')
            )

            await handleRefresh(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.FORBIDDEN
            )
        })
    })

    describe('getMe', () => {
        it('should call next with ApiError if no userId in payload', async () => {
            req.payload = {}

            await getMe(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should call next with ApiError if no role in payload', async () => {
            req.payload = { userId: '1' }

            await getMe(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should call next with ApiError if user not found', async () => {
            req.payload = { userId: '1', role: 'LCD' }
            ;(authService.getUserById as jest.Mock).mockResolvedValue(null)

            await getMe(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.NOT_FOUND
            )
        })

        it('should return user without password', async () => {
            req.payload = { userId: '1', role: 'LCD' }
            const user = { id: '1', username: 'test', password: 'hashed' }
            ;(authService.getUserById as jest.Mock).mockResolvedValue(user)

            await getMe(req, res, next)

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: { id: '1', username: 'test' },
                })
            )
        })
    })

    describe('handleChangePassword', () => {
        it('should call next with ApiError if not authorized (no payload)', async () => {
            req.payload = null
            await handleChangePassword(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should call next with ApiError if no userId in payload', async () => {
            req.payload = { role: 'LCD' }
            await handleChangePassword(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should call next with ApiError if no role in payload', async () => {
            req.payload = { userId: '1' }
            await handleChangePassword(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
        })

        it('should call changePassword and return 200 on success', async () => {
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
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Đổi mật khẩu thành công',
                })
            )
        })
    })
})
