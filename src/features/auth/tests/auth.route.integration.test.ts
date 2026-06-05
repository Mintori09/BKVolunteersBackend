import request from 'supertest'
import app from 'src/app'
import { HttpStatus } from 'src/common/constants'
import * as authService from '../auth.service'
import * as argon2 from 'argon2'

jest.mock('../auth.service')
jest.mock('argon2')
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn((token: string) => {
        if (token === 'valid-token') {
            return { userId: 'user-123', role: 'LCD' }
        }

        return { userId: 'user-456', role: 'LCD' }
    }),
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
    username: 'testuser99',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'LCD' as const,
    facultyId: null,
    status: 'ACTIVE' as const,
    passwordHash: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
}

const mockStudent = {
    id: 'student-123',
    username: '123456789',
    mssv: '123456789',
    fullName: 'Sinh Vien',
    email: 'student@example.com',
    firstName: 'Sinh',
    lastName: 'Vien',
    role: 'SINHVIEN' as const,
    facultyId: null,
    status: 'ACTIVE' as const,
    passwordHash: 'hashed-password',
    className: null,
    phone: null,
    totalPoints: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
}

describe('Auth Routes Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        ;(authService.getUserById as jest.Mock).mockResolvedValue(mockUser)
    })

    describe('POST /api/v1/auth/login', () => {
        it('returns 400 when username is missing', async () => {
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ password: 'password123' })

            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
            expect(response.body).toHaveProperty('success', false)
        })

        it('returns 401 when user does not exist', async () => {
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(null)

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ username: 'nonexistent99', password: 'password123' })

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
            expect(response.body.message).toContain('Identifier')
        })

        it('returns 403 when account is locked', async () => {
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue({ ...mockUser, status: 'LOCKED' })

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ username: 'testuser99', password: 'password123' })

            expect(response.status).toBe(HttpStatus.FORBIDDEN)
        })

        it('returns 200 with tokens when credentials are valid', async () => {
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(mockUser)
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
            })
            ;(authService.updateLastLoginAt as jest.Mock).mockResolvedValue(
                undefined
            )

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ username: 'testuser99', password: 'password123456' })

            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body).toHaveProperty('success', true)
            expect(response.body.data).toHaveProperty('accessToken')
            expect(response.body.data).toHaveProperty('user')
            expect(response.headers['set-cookie']).toBeDefined()
        })

        it('logs in student by MSSV', async () => {
            ;(
                authService.getUserbyUsernameOrMssv as jest.Mock
            ).mockResolvedValue(mockStudent)
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
            })
            ;(authService.updateLastLoginAt as jest.Mock).mockResolvedValue(
                undefined
            )

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({ username: '123456789', password: 'password123456' })

            expect(response.status).toBe(HttpStatus.OK)
            expect(authService.createSession).toHaveBeenCalledWith(
                'student-123',
                'SINHVIEN'
            )
        })
    })

    describe('POST /api/v1/auth/logout', () => {
        it('returns 401 when not authenticated', async () => {
            const response = await request(app).post('/api/v1/auth/logout')
            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })

        it('returns 204 when authenticated and token exists', async () => {
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
        it('returns 401 when refresh token cookie is missing', async () => {
            const response = await request(app).post('/api/v1/auth/refresh')
            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
            expect(response.body.message).toContain('Khong tim thay refresh token')
        })

        it('returns 403 when token is not found in DB', async () => {
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
        })

        it('returns 200 with new access token when refresh token is valid', async () => {
            ;(
                authService.getRefreshTokenByToken as jest.Mock
            ).mockResolvedValue({ token: 'valid-token', userId: 'user-123' })
            ;(authService.verifyToken as jest.Mock).mockResolvedValue({
                userId: 'user-123',
                role: 'LCD',
            })
            ;(authService.getUserById as jest.Mock).mockResolvedValue(mockUser)
            ;(authService.createSession as jest.Mock).mockResolvedValue({
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
            })
            ;(authService.deleteRefreshToken as jest.Mock).mockResolvedValue(
                undefined
            )

            const response = await request(app)
                .post('/api/v1/auth/refresh')
                .set('Cookie', 'refresh_token=valid-token')

            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body).toHaveProperty('success', true)
            expect(response.body.data).toHaveProperty('accessToken')
            expect(response.body.data).toHaveProperty('user')
        })
    })

    describe('GET /api/v1/auth/me', () => {
        it('returns 401 when unauthenticated', async () => {
            const response = await request(app).get('/api/v1/auth/me')
            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })

        it('returns 403 when authenticated account is locked', async () => {
            ;(authService.getUserById as jest.Mock).mockResolvedValue({
                ...mockUser,
                status: 'LOCKED',
            })

            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', 'Bearer valid-token')

            expect(response.status).toBe(HttpStatus.FORBIDDEN)
            expect(response.body.message).toContain('khoa')
        })

        it('returns 200 with user data when authenticated', async () => {
            ;(authService.getUserById as jest.Mock).mockResolvedValue(mockUser)

            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', 'Bearer valid-token')

            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body).toHaveProperty('success', true)
            expect(response.body.data).toHaveProperty('username', 'testuser99')
        })
    })

    describe('PATCH /api/v1/auth/me', () => {
        it('returns 401 when unauthenticated', async () => {
            const response = await request(app).patch('/api/v1/auth/me').send({
                email: 'student@example.com',
            })

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })

        it('returns 200 with updated profile when authenticated', async () => {
            ;(authService.updateProfile as jest.Mock).mockResolvedValue({
                ...mockStudent,
                fullName: 'Sinh Vien Moi',
                phone: '0901234567',
            })

            const response = await request(app)
                .patch('/api/v1/auth/me')
                .set('Authorization', 'Bearer valid-token')
                .send({
                    email: 'student@example.com',
                    fullName: 'Sinh Vien Moi',
                    phone: '0901234567',
                })

            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body).toHaveProperty('success', true)
            expect(response.body.data).toHaveProperty(
                'fullName',
                'Sinh Vien Moi'
            )
        })
    })

    describe('PATCH /api/v1/auth/change-password', () => {
        it('returns 401 when unauthenticated', async () => {
            const response = await request(app)
                .patch('/api/v1/auth/change-password')
                .send({
                    oldPassword: 'oldpassword123',
                    newPassword: 'newpassword123',
                    newPasswordConfirm: 'newpassword123',
                })

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })

        it('returns 400 when newPassword and confirm mismatch', async () => {
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

        it('returns 200 when password is changed successfully', async () => {
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
            expect(response.body.message).toContain('Doi mat khau thanh cong')
        })
    })
})
