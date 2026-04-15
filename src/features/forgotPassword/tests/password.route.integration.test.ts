import request from 'supertest'
import app from 'src/app'
import { HttpStatus } from 'src/common/constants'
import * as authService from 'src/features/auth/auth.service'
import * as forgotPasswordService from '../forgotPassword.service'

jest.mock('src/features/auth/auth.service')
jest.mock('../forgotPassword.service')
jest.mock('argon2')
jest.mock('src/config', () => ({
    prismaClient: {},
    config: {
        node_env: 'test',
        jwt: {
            refresh_token: {
                cookie_name: 'refresh_token',
                secret: 'test-refresh-secret',
            },
            access_token: {
                secret: 'test-access-secret',
            },
        },
    },
    refreshTokenCookieConfig: {
        httpOnly: true,
        secure: false,
        sameSite: 'strict' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
    clearRefreshTokenCookieConfig: {
        httpOnly: true,
        secure: false,
        sameSite: 'strict' as const,
    },
    corsConfig: {},
    helmetConfig: {},
    uploadConfig: {
        image: {
            maxSize: 5 * 1024 * 1024,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
            storagePath: '/uploads/images',
            urlPrefix: '/files/images',
        },
        document: {
            maxSize: 10 * 1024 * 1024,
            allowedMimeTypes: ['application/pdf'],
            allowedExtensions: ['.pdf'],
            storagePath: '/uploads/documents',
            urlPrefix: '/files/documents',
        },
        basePath: '/uploads',
        staticUrlPrefix: '/files',
    },
    getAbsoluteStoragePath: (path: string) => path,
}))

const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashed-password',
    role: 'LCD' as const,
}

describe('Password Routes Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('POST /api/v1/password/forgot-password', () => {
        it('should return 400 when email is missing', async () => {
            const response = await request(app)
                .post('/api/v1/password/forgot-password')
                .send({})

            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
            expect(response.body).toHaveProperty('success', false)
        })

        it('should return 400 when email format is invalid', async () => {
            const response = await request(app)
                .post('/api/v1/password/forgot-password')
                .send({ email: 'invalid-email' })

            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })

        it('should return 404 when email does not exist in system', async () => {
            ;(authService.getUserByEmail as jest.Mock).mockResolvedValue(null)

            const response = await request(app)
                .post('/api/v1/password/forgot-password')
                .send({ email: 'nonexistent@example.com' })

            expect(response.status).toBe(HttpStatus.NOT_FOUND)
            expect(response.body).toHaveProperty('success', false)
            expect(response.body.message).toContain('không tồn tại')
        })

        it('should return 200 and send reset email when email is valid', async () => {
            ;(authService.getUserByEmail as jest.Mock).mockResolvedValue(
                mockUser
            )
            ;(
                forgotPasswordService.createResetToken as jest.Mock
            ).mockResolvedValue('reset-token-uuid')

            const response = await request(app)
                .post('/api/v1/password/forgot-password')
                .send({ email: 'test@example.com' })

            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body).toHaveProperty('success', true)
            expect(response.body.message).toContain('Email đặt lại mật khẩu')
            expect(forgotPasswordService.createResetToken).toHaveBeenCalledWith(
                'user-123',
                'test@example.com'
            )
        })
    })

    describe('POST /api/v1/password/reset-password/:token', () => {
        const validJwtToken =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

        it('should return 404 when token is missing in params', async () => {
            const response = await request(app)
                .post('/api/v1/password/reset-password/')
                .send({ newPassword: 'newpassword123' })

            expect(response.status).toBe(HttpStatus.NOT_FOUND)
        })

        it('should return 400 when body is missing newPassword', async () => {
            const response = await request(app)
                .post(`/api/v1/password/reset-password/${validJwtToken}`)
                .send({})

            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })

        it('should return 400 when newPassword is too short (less than 6 chars)', async () => {
            const response = await request(app)
                .post(`/api/v1/password/reset-password/${validJwtToken}`)
                .send({ newPassword: 'short' })

            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })

        it('should return 400 when token format is invalid (not JWT)', async () => {
            const response = await request(app)
                .post('/api/v1/password/reset-password/invalid-token')
                .send({ newPassword: 'newpassword123' })

            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })

        it('should return 404 when token is not found in DB or expired', async () => {
            ;(
                forgotPasswordService.getResetToken as jest.Mock
            ).mockResolvedValue(null)

            const response = await request(app)
                .post(`/api/v1/password/reset-password/${validJwtToken}`)
                .send({ newPassword: 'newpassword123' })

            expect(response.status).toBe(HttpStatus.NOT_FOUND)
            expect(response.body.message).toContain(
                'không hợp lệ hoặc đã hết hạn'
            )
        })

        it('should return 200 when password is reset successfully', async () => {
            const mockResetToken = {
                id: 'token-id',
                token: validJwtToken,
                userId: 'user-123',
                expiresAt: new Date(Date.now() + 3600000),
            }
            ;(
                forgotPasswordService.getResetToken as jest.Mock
            ).mockResolvedValue(mockResetToken)
            ;(
                forgotPasswordService.resetUserPassword as jest.Mock
            ).mockResolvedValue(undefined)

            const response = await request(app)
                .post(`/api/v1/password/reset-password/${validJwtToken}`)
                .send({ newPassword: 'newpassword123' })

            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body).toHaveProperty('success', true)
            expect(response.body.message).toContain(
                'Đặt lại mật khẩu thành công'
            )
            expect(
                forgotPasswordService.resetUserPassword
            ).toHaveBeenCalledWith('user-123', 'newpassword123')
        })

        it('should call resetUserPassword with correct userId and newPassword', async () => {
            const mockResetToken = {
                id: 'token-id',
                token: validJwtToken,
                userId: 'user-456',
                expiresAt: new Date(Date.now() + 3600000),
            }
            ;(
                forgotPasswordService.getResetToken as jest.Mock
            ).mockResolvedValue(mockResetToken)
            ;(
                forgotPasswordService.resetUserPassword as jest.Mock
            ).mockResolvedValue(undefined)

            await request(app)
                .post(`/api/v1/password/reset-password/${validJwtToken}`)
                .send({ newPassword: 'securePassword789' })

            expect(
                forgotPasswordService.resetUserPassword
            ).toHaveBeenCalledWith('user-456', 'securePassword789')
        })
    })
})
