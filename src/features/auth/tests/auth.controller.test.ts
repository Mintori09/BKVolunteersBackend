import { HttpStatus } from 'src/common/constants'
import {
    handleLogin,
    handleLogout,
    handleRefresh,
    handleChangePassword,
} from 'src/features/auth/auth.controller'
import * as argon2 from 'argon2'
import { NextFunction } from 'express'
import * as authService from '../auth.service'
import { ApiError } from 'src/utils/ApiError'

// Mock dependencies
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
        it('should call next with ApiError if user does not exist', async () => {
            req.body = { email: 'test@example.com', password: 'password' }
            ;(authService.getUserByEmail as jest.Mock).mockResolvedValue(null)

            await handleLogin(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should call next with ApiError if password is invalid', async () => {
            req.body = { email: 'test@example.com', password: 'password' }
            const user = {
                id: '1',
                password: 'hashed',
                emailVerified: new Date(),
                role: 'USER',
            }
            ;(authService.getUserByEmail as jest.Mock).mockResolvedValue(user)
            ;(argon2.verify as jest.Mock).mockResolvedValue(false)

            await handleLogin(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should login and return tokens if credentials are valid', async () => {
            req.body = { email: 'test@example.com', password: 'password' }
            const user = {
                id: '1',
                password: 'hashed',
                emailVerified: new Date(),
                role: 'USER',
            }
            ;(authService.getUserByEmail as jest.Mock).mockResolvedValue(user)
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
    })

    describe('handleLogout', () => {
        it('should return 204 if no refresh token in cookies', async () => {
            await handleLogout(req, res, next)
            expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.NO_CONTENT)
        })

        it('should clear cookie and return 204 if token exists', async () => {
            req.cookies = { refresh_token: 'token' }
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue({ token: 'token' })

            await handleLogout(req, res, next)

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

        it('should call next with ApiError if token is not found in DB', async () => {
            req.cookies = { refresh_token: 'token' }
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue(null)
            ;(authService.verifyToken as jest.Mock).mockResolvedValue({
                userId: '1',
            })

            await handleRefresh(req, res, next)
            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.FORBIDDEN
            )
        })

        it('should create new session if refresh token is valid', async () => {
            req.cookies = { refresh_token: 'token' }
            const payload = { userId: '1' }
            const user = { id: '1', role: 'USER' }

            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue({ token: 'token', userId: '1' })
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

        it('should call changePassword and return 200 on success', async () => {
            req.payload = { userId: '1' }
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
