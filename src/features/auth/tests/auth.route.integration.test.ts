import request from 'supertest'
import app from 'src/app'
import { HttpStatus } from 'src/common/constants'
import * as authService from '../auth.service'
import * as argon2 from 'argon2'

jest.mock('../auth.service')
jest.mock('argon2')
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(
        (
            token: string,
            secret: string,
            callback: (err: null, payload: unknown) => void
        ) => {
            if (token === 'valid-token') {
                callback(null, { userId: 'user-123', role: 'LCD' })
            } else {
                callback(null, { userId: 'user-456', role: 'LCD' })
            }
        }
    ),
}))
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
}))

const mockUser = {
    id: 'user-123',
    username: 'testuser99',
    email: 'test@example.com',
    password: 'hashed-password',
    role: 'LCD' as const,
}

const mockStudent = {
    id: 'student-123',
    mssv: '123456789',
    email: 'student@example.com',
    password: 'hashed-password',
}

describe('Auth Routes Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('POST /api/v1/auth/login', () => {
        it('should return 400 when body is missing username', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ password: 'password123' })

            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
            expect(response.body).toHaveProperty('success', false)
            expect(response.body).toHaveProperty('message', 'Validation failed')
        })

        it('should return 400 when body is missing password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ username: 'testuser99' })

            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
            expect(response.body).toHaveProperty('success', false)
        })

        it('should return 400 when username is too short', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ username: 'ab', password: 'password123' })

            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })

        it('should return 401 when user does not exist', async () => {
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(null)

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ username: 'nonexistent99', password: 'password123' })

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
            expect(response.body).toHaveProperty('success', false)
            expect(response.body.message).toContain('không hợp lệ')
        })

        it('should return 401 when password is invalid', async () => {
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(mockUser)
            ;(argon2.verify as jest.Mock).mockResolvedValue(false)

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ username: 'testuser99', password: 'wrongpassword123' })

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
            expect(response.body).toHaveProperty('success', false)
        })

        it('should return 200 with accessToken when credentials are valid', async () => {
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(mockUser)
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
            })
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue(null)

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ username: 'testuser99', password: 'password123456' })

            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body).toHaveProperty('success', true)
            expect(response.body).toHaveProperty('data')
            expect(response.body.data).toHaveProperty('accessToken')
            expect(response.headers['set-cookie']).toBeDefined()
        })

        it('should login student with SINHVIEN role when using MSSV', async () => {
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(mockStudent)
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
            })
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue(null)

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ username: '123456789', password: 'password123456' })

            expect(response.status).toBe(HttpStatus.OK)
            expect(authService.createSession).toHaveBeenCalledWith(
                'student-123',
                'SINHVIEN'
            )
        })

        it('should clear existing refresh token cookie on login', async () => {
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(mockUser)
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
            })
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue({
                token: 'old-refresh-token',
                userId: 'user-123',
            })
            ;(authService.deleteRefreshToken as jest.Mock).mockResolvedValue(
                undefined
            )

            const response = await request(app)
                .post('/api/v1/auth/login')
                .set('Cookie', 'refresh_token=old-refresh-token')
                .send({ username: 'testuser99', password: 'password123456' })

            expect(response.status).toBe(HttpStatus.OK)
        })
    })

    describe('POST /api/v1/auth/logout', () => {
        it('should return 401 when not authenticated (no Bearer token)', async () => {
            const response = await request(app).post('/api/v1/auth/logout')

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })

        it('should return 204 and clear cookie when refresh token not found in DB', async () => {
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue(null)

            const response = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', 'Bearer valid-token')
                .set('Cookie', 'refresh_token=some-token')

            expect(response.status).toBe(HttpStatus.NO_CONTENT)
        })

        it('should return 204 and delete token from DB when valid', async () => {
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue({ token: 'valid-token', userId: 'user-123' })
            ;(authService.deleteRefreshToken as jest.Mock).mockResolvedValue(
                undefined
            )

            const response = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', 'Bearer valid-token')
                .set('Cookie', 'refresh_token=valid-token')

            expect(response.status).toBe(HttpStatus.NO_CONTENT)
            expect(authService.deleteRefreshToken).toHaveBeenCalledWith(
                'valid-token'
            )
        })
    })

    describe('POST /api/v1/auth/refresh', () => {
        it('should return 401 when no refresh token in cookies', async () => {
            const response = await request(app).post('/api/v1/auth/refresh')

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
            expect(response.body.message).toContain(
                'Không tìm thấy refresh token'
            )
        })

        it('should return 403 when token is not found in DB', async () => {
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue(null)
            ;(authService.verifyToken as jest.Mock).mockResolvedValue({
                userId: 'user-123',
                role: 'LCD',
            })

            const response = await request(app)
                .post('/api/v1/auth/refresh')
                .set('Cookie', 'refresh_token=invalid-token')

            expect(response.status).toBe(HttpStatus.FORBIDDEN)
            expect(response.body.message).toContain('không hợp lệ')
        })

        it('should return 403 when token userId does not match payload', async () => {
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue({
                token: 'token',
                userId: 'user-123',
                userType: 'user',
            })
            ;(authService.verifyToken as jest.Mock).mockResolvedValue({
                userId: 'user-456',
                role: 'LCD',
            })
            ;(authService.deleteRefreshToken as jest.Mock).mockResolvedValue(
                undefined
            )

            const response = await request(app)
                .post('/api/v1/auth/refresh')
                .set('Cookie', 'refresh_token=valid-token')

            expect(response.status).toBe(HttpStatus.FORBIDDEN)
        })

        it('should return 200 with new tokens when refresh token is valid', async () => {
            const payload = { userId: 'user-123', role: 'LCD' }
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue({
                token: 'valid-token',
                userId: 'user-123',
                userType: 'user',
            })
            ;(authService.verifyToken as jest.Mock).mockResolvedValue(payload)
            ;(authService.getUserById as jest.Mock).mockResolvedValue(mockUser)
            ;(authService.deleteRefreshToken as jest.Mock).mockResolvedValue(
                undefined
            )
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
            })

            const response = await request(app)
                .post('/api/v1/auth/refresh')
                .set('Cookie', 'refresh_token=valid-token')

            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body).toHaveProperty('success', true)
            expect(response.body.data).toHaveProperty('accessToken')
        })
    })

    describe('GET /api/v1/auth/me', () => {
        it('should return 401 when not authenticated', async () => {
            const response = await request(app).get('/api/v1/auth/me')

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })

        it('should return 200 with user data when authenticated', async () => {
            ;(authService.getUserById as jest.Mock).mockResolvedValue(mockUser)

            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', 'Bearer valid-token')

            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body).toHaveProperty('success', true)
        })
    })

    describe('PATCH /api/v1/auth/change-password', () => {
        it('should return 401 when not authenticated', async () => {
            const response = await request(app)
                .patch('/api/v1/auth/change-password')
                .send({
                    oldPassword: 'oldpassword',
                    newPassword: 'newpassword123',
                    newPasswordConfirm: 'newpassword123',
                })

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })

        it('should return 400 when oldPassword is too short', async () => {
            const response = await request(app)
                .patch('/api/v1/auth/change-password')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    oldPassword: 'short',
                    newPassword: 'newpassword123',
                    newPasswordConfirm: 'newpassword123',
                })

            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })

        it('should return 400 when newPassword does not match newPasswordConfirm', async () => {
            const response = await request(app)
                .patch('/api/v1/auth/change-password')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    oldPassword: 'oldpassword123',
                    newPassword: 'newpassword123',
                    newPasswordConfirm: 'differentpassword',
                })

            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })

        it('should return 200 when password is changed successfully', async () => {
            ;(authService.changePassword as jest.Mock).mockResolvedValue(
                undefined
            )

            const response = await request(app)
                .patch('/api/v1/auth/change-password')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    oldPassword: 'oldpassword123',
                    newPassword: 'newpassword123',
                    newPasswordConfirm: 'newpassword123',
                })

            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body).toHaveProperty('success', true)
            expect(response.body.message).toContain('Đổi mật khẩu thành công')
        })
    })

    describe('Route not found', () => {
        it('should return 404 for non-existent route', async () => {
            const response = await request(app).get('/api/v1/auth/nonexistent')

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })
    })
})
