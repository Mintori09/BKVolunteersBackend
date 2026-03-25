import * as authService from '../auth.service'
import * as authRepository from '../auth.repository'
import * as argon2 from 'argon2'
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
jest.mock('argon2')
jest.mock('node:crypto')
jest.mock('src/utils/sendEmail.util')
jest.mock('src/utils/generateTokens.util')

describe('Auth Service', () => {
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
