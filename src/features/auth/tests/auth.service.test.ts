import * as authService from '../auth.service'
import * as authRepository from '../auth.repository'
import * as argon2 from 'argon2'
import * as jwt from 'jsonwebtoken'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import { UserRole } from '../types'
import {
    createAccessToken,
    createRefreshToken,
} from 'src/utils/generateTokens.util'

jest.mock('src/config', () => ({
    prismaClient: {},
    config: {
        node_env: 'test',
        jwt: {
            refresh_token: {
                cookie_name: 'refresh_token',
                secret: 'refresh-secret',
            },
            access_token: {
                secret: 'access-secret',
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
jest.mock('../utils', () => ({
    isMssv: jest.fn((username: string) => /^1\d{8}$/.test(username)),
}))
jest.mock('argon2')
jest.mock('node:crypto')
jest.mock('src/utils/sendEmail.util')
jest.mock('src/utils/generateTokens.util')
jest.mock('jsonwebtoken')

describe('Auth Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getUserbyUsernameOrMssv', () => {
        it('should call getUserByMssv when username is MSSV format (9 digits starting with 1)', async () => {
            const mssv = '123456789'
            const expectedUser = { id: '1', mssv, password: 'hashed' }
            ;(authRepository.getUserByMssv as jest.Mock).mockResolvedValue(
                expectedUser
            )

            const result = await authService.getUserbyUsernameOrMssv(mssv)

            expect(authRepository.getUserByMssv).toHaveBeenCalledWith(mssv)
            expect(authRepository.getUserByUsername).not.toHaveBeenCalled()
            expect(result).toEqual(expectedUser)
        })

        it('should call getUserByUsername when username is not MSSV format', async () => {
            const username = 'testuser'
            const expectedUser = { id: '1', username, password: 'hashed' }
            ;(authRepository.getUserByUsername as jest.Mock).mockResolvedValue(
                expectedUser
            )

            const result = await authService.getUserbyUsernameOrMssv(username)

            expect(authRepository.getUserByUsername).toHaveBeenCalledWith(
                username
            )
            expect(authRepository.getUserByMssv).not.toHaveBeenCalled()
            expect(result).toEqual(expectedUser)
        })

        it('should return null when user not found by MSSV', async () => {
            ;(authRepository.getUserByMssv as jest.Mock).mockResolvedValue(null)

            const result =
                await authService.getUserbyUsernameOrMssv('123456789')

            expect(result).toBeNull()
        })

        it('should return null when user not found by username', async () => {
            ;(authRepository.getUserByUsername as jest.Mock).mockResolvedValue(
                null
            )

            const result =
                await authService.getUserbyUsernameOrMssv('nonexistent')

            expect(result).toBeNull()
        })
    })

    describe('getUserByEmail', () => {
        it('should call repository getUserByEmail and return result', async () => {
            const email = 'test@example.com'
            const expectedUser = { id: '1', email }
            ;(authRepository.getUserByEmail as jest.Mock).mockResolvedValue(
                expectedUser
            )

            const result = await authService.getUserByEmail(email)

            expect(authRepository.getUserByEmail).toHaveBeenCalledWith(email)
            expect(result).toEqual(expectedUser)
        })
    })

    describe('getUserById', () => {
        it('should call repository getUserById with correct params', async () => {
            const userId = 'user-1'
            const role: UserRole = 'LCD'
            const expectedUser = { id: userId, role }
            ;(authRepository.getUserById as jest.Mock).mockResolvedValue(
                expectedUser
            )

            const result = await authService.getUserById(userId, role)

            expect(authRepository.getUserById).toHaveBeenCalledWith(
                userId,
                role
            )
            expect(result).toEqual(expectedUser)
        })
    })

    describe('getRefreshTokenByToken', () => {
        it('should call repository getRefreshTokenByToken', async () => {
            const token = 'refresh-token-123'
            const expectedToken = { token, userId: '1' }
            ;(
                authRepository.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue(expectedToken)

            const result = await authService.getRefreshTokenByToken(token)

            expect(authRepository.getRefreshTokenByToken).toHaveBeenCalledWith(
                token
            )
            expect(result).toEqual(expectedToken)
        })

        it('should return null when token not found', async () => {
            ;(
                authRepository.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue(null)

            const result =
                await authService.getRefreshTokenByToken('nonexistent-token')

            expect(result).toBeNull()
        })
    })

    describe('deleteRefreshToken', () => {
        it('should call repository deleteRefreshToken without role', async () => {
            const token = 'token-to-delete'
            ;(authRepository.deleteRefreshToken as jest.Mock).mockResolvedValue(
                undefined
            )

            await authService.deleteRefreshToken(token)

            expect(authRepository.deleteRefreshToken).toHaveBeenCalledWith(
                token,
                undefined
            )
        })

        it('should call repository deleteRefreshToken with role', async () => {
            const token = 'token-to-delete'
            const role: UserRole = 'LCD'
            ;(authRepository.deleteRefreshToken as jest.Mock).mockResolvedValue(
                undefined
            )

            await authService.deleteRefreshToken(token, role)

            expect(authRepository.deleteRefreshToken).toHaveBeenCalledWith(
                token,
                role
            )
        })
    })

    describe('deleteAllUserRefreshTokens', () => {
        it('should call repository deleteAllUserRefreshTokens', async () => {
            const userId = 'user-1'
            const role: UserRole = 'SINHVIEN'
            ;(
                authRepository.deleteAllUserRefreshTokens as jest.Mock
            ).mockResolvedValue(undefined)

            await authService.deleteAllUserRefreshTokens(userId, role)

            expect(
                authRepository.deleteAllUserRefreshTokens
            ).toHaveBeenCalledWith(userId, role)
        })
    })

    describe('createSession', () => {
        it('should create access and refresh tokens and save to repository', async () => {
            const userId = 'user-1'
            const role: UserRole = 'LCD'
            const accessToken = 'access-token-123'
            const refreshToken = 'refresh-token-123'

            ;(createAccessToken as jest.Mock).mockReturnValue(accessToken)
            ;(createRefreshToken as jest.Mock).mockReturnValue(refreshToken)
            ;(authRepository.createRefreshToken as jest.Mock).mockResolvedValue(
                undefined
            )

            const result = await authService.createSession(userId, role)

            expect(createAccessToken).toHaveBeenCalledWith(
                userId,
                role,
                undefined
            )
            expect(createRefreshToken).toHaveBeenCalledWith(userId)
            expect(authRepository.createRefreshToken).toHaveBeenCalledWith(
                userId,
                refreshToken,
                role
            )
            expect(result).toEqual({ accessToken, refreshToken })
        })

        it('should create session for SINHVIEN with facultyId', async () => {
            const userId = 'student-1'
            const role: UserRole = 'SINHVIEN'
            const student = { id: userId, mssv: '123456789', facultyId: '101' }
            const accessToken = 'access-token-123'
            const refreshToken = 'refresh-token-123'

            ;(authRepository.getUserById as jest.Mock).mockResolvedValue(student)
            ;(createAccessToken as jest.Mock).mockReturnValue(accessToken)
            ;(createRefreshToken as jest.Mock).mockReturnValue(refreshToken)
            ;(authRepository.createRefreshToken as jest.Mock).mockResolvedValue(
                undefined
            )

            const result = await authService.createSession(userId, role)

            expect(authRepository.getUserById).toHaveBeenCalledWith(userId, role)
            expect(createAccessToken).toHaveBeenCalledWith(userId, role, '101')
            expect(result).toEqual({ accessToken, refreshToken })
        })

        it('should create session for SINHVIEN without facultyId', async () => {
            const userId = 'student-1'
            const role: UserRole = 'SINHVIEN'
            const student = { id: userId, mssv: '123456789', facultyId: null }
            const accessToken = 'access-token-123'
            const refreshToken = 'refresh-token-123'

            ;(authRepository.getUserById as jest.Mock).mockResolvedValue(student)
            ;(createAccessToken as jest.Mock).mockReturnValue(accessToken)
            ;(createRefreshToken as jest.Mock).mockReturnValue(refreshToken)
            ;(authRepository.createRefreshToken as jest.Mock).mockResolvedValue(
                undefined
            )

            const result = await authService.createSession(userId, role)

            expect(createAccessToken).toHaveBeenCalledWith(userId, role, null)
            expect(result).toEqual({ accessToken, refreshToken })
        })

        it('should create session for SINHVIEN when student not found', async () => {
            const userId = 'student-1'
            const role: UserRole = 'SINHVIEN'
            const accessToken = 'access-token-123'
            const refreshToken = 'refresh-token-123'

            ;(authRepository.getUserById as jest.Mock).mockResolvedValue(null)
            ;(createAccessToken as jest.Mock).mockReturnValue(accessToken)
            ;(createRefreshToken as jest.Mock).mockReturnValue(refreshToken)
            ;(authRepository.createRefreshToken as jest.Mock).mockResolvedValue(
                undefined
            )

            const result = await authService.createSession(userId, role)

            expect(createAccessToken).toHaveBeenCalledWith(userId, role, undefined)
            expect(result).toEqual({ accessToken, refreshToken })
        })

        it('should create session for non-SINHVIEN with facultyId', async () => {
            const userId = 'user-1'
            const role: UserRole = 'LCD'
            const user = { id: userId, role, facultyId: 1 }
            const accessToken = 'access-token-123'
            const refreshToken = 'refresh-token-123'

            ;(authRepository.getUserById as jest.Mock).mockResolvedValue(user)
            ;(createAccessToken as jest.Mock).mockReturnValue(accessToken)
            ;(createRefreshToken as jest.Mock).mockReturnValue(refreshToken)
            ;(authRepository.createRefreshToken as jest.Mock).mockResolvedValue(
                undefined
            )

            const result = await authService.createSession(userId, role)

            expect(authRepository.getUserById).toHaveBeenCalledWith(userId, role)
            expect(createAccessToken).toHaveBeenCalledWith(userId, role, 1)
            expect(result).toEqual({ accessToken, refreshToken })
        })

        it('should create session for non-SINHVIEN without facultyId', async () => {
            const userId = 'user-1'
            const role: UserRole = 'LCD'
            const user = { id: userId, role, facultyId: null }
            const accessToken = 'access-token-123'
            const refreshToken = 'refresh-token-123'

            ;(authRepository.getUserById as jest.Mock).mockResolvedValue(user)
            ;(createAccessToken as jest.Mock).mockReturnValue(accessToken)
            ;(createRefreshToken as jest.Mock).mockReturnValue(refreshToken)
            ;(authRepository.createRefreshToken as jest.Mock).mockResolvedValue(
                undefined
            )

            const result = await authService.createSession(userId, role)

            expect(createAccessToken).toHaveBeenCalledWith(userId, role, null)
            expect(result).toEqual({ accessToken, refreshToken })
        })
    })

    describe('verifyToken', () => {
        it('should resolve with payload when token is valid', async () => {
            const token = 'valid-token'
            const secret = 'secret'
            const payload = { userId: '1', role: 'LCD' }

            ;(jwt.verify as jest.Mock).mockImplementation(
                (
                    _token: string,
                    _secret: string,
                    callback: (err: Error | null, payload: unknown) => void
                ) => {
                    callback(null, payload)
                }
            )

            const result = await authService.verifyToken(token, secret)

            expect(result).toEqual(payload)
        })

        it('should reject with ApiError when token is invalid/expired', async () => {
            const token = 'invalid-token'
            const secret = 'secret'
            const error = new Error('jwt expired')

            ;(jwt.verify as jest.Mock).mockImplementation(
                (
                    _token: string,
                    _secret: string,
                    callback: (err: Error | null, payload: unknown) => void
                ) => {
                    callback(error, null)
                }
            )

            await expect(
                authService.verifyToken(token, secret)
            ).rejects.toThrow(
                new ApiError(HttpStatus.FORBIDDEN, 'Token không hợp lệ')
            )
        })

        it('should reject with ApiError when token verification fails', async () => {
            const token = 'malformed-token'
            const secret = 'secret'
            const error = new Error('jwt malformed')

            ;(jwt.verify as jest.Mock).mockImplementation(
                (
                    _token: string,
                    _secret: string,
                    callback: (err: Error | null, payload: unknown) => void
                ) => {
                    callback(error, null)
                }
            )

            await expect(
                authService.verifyToken(token, secret)
            ).rejects.toThrow(ApiError)
        })
    })

    describe('changePassword', () => {
        const userId = 'user-1'
        const role: UserRole = 'LCD'
        const changePasswordData = {
            oldPassword: 'old-password',
            newPassword: 'new-password',
            newPasswordConfirm: 'new-password',
        }

        it('should throw ApiError if user is not found', async () => {
            ;(authRepository.getUserById as jest.Mock).mockResolvedValue(null)

            await expect(
                authService.changePassword(userId, role, changePasswordData)
            ).rejects.toThrow(
                new ApiError(HttpStatus.NOT_FOUND, 'Tài khoản không tồn tại')
            )
        })

        it('should throw ApiError if old password is invalid', async () => {
            const user = { id: userId, password: 'hashed-old-password' }
            ;(authRepository.getUserById as jest.Mock).mockResolvedValue(user)
            ;(argon2.verify as jest.Mock).mockResolvedValue(false)

            await expect(
                authService.changePassword(userId, role, changePasswordData)
            ).rejects.toThrow(
                new ApiError(HttpStatus.UNAUTHORIZED, 'Sai mật khẩu cũ')
            )
        })

        it('should update password if old password is valid', async () => {
            const user = { id: userId, password: 'hashed-old-password' }
            ;(authRepository.getUserById as jest.Mock).mockResolvedValue(user)
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(argon2.hash as jest.Mock).mockResolvedValue('hashed-new-password')

            await authService.changePassword(userId, role, changePasswordData)

            expect(argon2.verify).toHaveBeenCalledWith(
                'hashed-old-password',
                changePasswordData.oldPassword
            )
            expect(argon2.hash).toHaveBeenCalledWith(
                changePasswordData.newPassword
            )
            expect(authRepository.updatePassword).toHaveBeenCalledWith(
                userId,
                'hashed-new-password',
                role
            )
        })
    })
})
