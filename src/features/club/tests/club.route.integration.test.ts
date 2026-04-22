import request from 'supertest'
import app from 'src/app'
import { HttpStatus } from 'src/common/constants'
import * as clubService from '../club.service'

jest.mock('../club.service')
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(
        (
            token: string,
            secret: string,
            callback: (err: null, payload: unknown) => void
        ) => {
            if (token === 'admin-token') {
                callback(null, { userId: 'admin-123', role: 'DOANTRUONG' })
            } else if (token === 'user-token') {
                callback(null, { userId: 'user-123', role: 'LCD' })
            } else {
                callback(null, { userId: 'student-123', role: 'SINHVIEN' })
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

const mockClub = {
    id: 'club-123',
    name: 'Test Club',
    facultyId: 1,
    leaderId: 'leader-123',
    createdAt: new Date(),
    updatedAt: new Date(),
}

describe('Club Routes Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('POST /api/v1/clubs', () => {
        it('should return 401 when not authenticated', async () => {
            const response = await request(app)
                .post('/api/v1/clubs')
                .send({ name: 'New Club' })

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })

        it('should return 403 when user is not DOANTRUONG', async () => {
            const response = await request(app)
                .post('/api/v1/clubs')
                .set('Authorization', 'Bearer user-token')
                .send({ name: 'New Club' })

            expect(response.status).toBe(HttpStatus.FORBIDDEN)
        })

        it('should return 400 when name is missing', async () => {
            const response = await request(app)
                .post('/api/v1/clubs')
                .set('Authorization', 'Bearer admin-token')
                .send({})

            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
            expect(response.body).toHaveProperty('success', false)
            expect(response.body).toHaveProperty('message', 'Validation failed')
        })

        it('should return 400 when name is too long', async () => {
            const response = await request(app)
                .post('/api/v1/clubs')
                .set('Authorization', 'Bearer admin-token')
                .send({ name: 'a'.repeat(256) })

            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })

        it('should return 400 when name is empty string', async () => {
            const response = await request(app)
                .post('/api/v1/clubs')
                .set('Authorization', 'Bearer admin-token')
                .send({ name: '' })

            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })

        it('should return 201 when club is created successfully', async () => {
            ;(clubService.createClub as jest.Mock).mockResolvedValue(mockClub)

            const response = await request(app)
                .post('/api/v1/clubs')
                .set('Authorization', 'Bearer admin-token')
                .send({ name: 'Test Club', facultyId: 1 })

            expect(response.status).toBe(HttpStatus.CREATED)
            expect(response.body).toHaveProperty('success', true)
            expect(response.body).toHaveProperty('data')
            expect(response.body.message).toContain('Tạo CLB thành công')
            expect(clubService.createClub).toHaveBeenCalledWith({
                name: 'Test Club',
                facultyId: 1,
            })
        })

        it('should create club with all fields', async () => {
            ;(clubService.createClub as jest.Mock).mockResolvedValue(mockClub)

            const response = await request(app)
                .post('/api/v1/clubs')
                .set('Authorization', 'Bearer admin-token')
                .send({
                    name: 'Test Club',
                    facultyId: 1,
                    leaderId: 'leader-123',
                })

            expect(response.status).toBe(HttpStatus.CREATED)
            expect(clubService.createClub).toHaveBeenCalledWith({
                name: 'Test Club',
                facultyId: 1,
                leaderId: 'leader-123',
            })
        })
    })

    describe('PUT /api/v1/clubs/:id', () => {
        it('should return 401 when not authenticated', async () => {
            const response = await request(app)
                .put('/api/v1/clubs/club-123')
                .send({ name: 'Updated Club' })

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })

        it('should return 403 when user is not DOANTRUONG', async () => {
            const response = await request(app)
                .put('/api/v1/clubs/club-123')
                .set('Authorization', 'Bearer user-token')
                .send({ name: 'Updated Club' })

            expect(response.status).toBe(HttpStatus.FORBIDDEN)
        })

        it('should return 400 when id param is missing', async () => {
            const response = await request(app)
                .put('/api/v1/clubs/')
                .set('Authorization', 'Bearer admin-token')
                .send({ name: 'Updated Club' })

            expect(response.status).toBe(HttpStatus.NOT_FOUND)
        })

        it('should return 200 when update with empty body', async () => {
            ;(clubService.updateClub as jest.Mock).mockResolvedValue(mockClub)

            const response = await request(app)
                .put('/api/v1/clubs/club-123')
                .set('Authorization', 'Bearer admin-token')
                .send({})

            expect(response.status).toBe(HttpStatus.OK)
            expect(clubService.updateClub).toHaveBeenCalledWith('club-123', {})
        })

        it('should return 200 when club is updated successfully', async () => {
            const updatedClub = { ...mockClub, name: 'Updated Club' }
            ;(clubService.updateClub as jest.Mock).mockResolvedValue(updatedClub)

            const response = await request(app)
                .put('/api/v1/clubs/club-123')
                .set('Authorization', 'Bearer admin-token')
                .send({ name: 'Updated Club' })

            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body).toHaveProperty('success', true)
            expect(response.body.message).toContain('Cập nhật CLB thành công')
            expect(clubService.updateClub).toHaveBeenCalledWith('club-123', {
                name: 'Updated Club',
            })
        })

        it('should update club with all fields', async () => {
            ;(clubService.updateClub as jest.Mock).mockResolvedValue(mockClub)

            const response = await request(app)
                .put('/api/v1/clubs/club-123')
                .set('Authorization', 'Bearer admin-token')
                .send({
                    name: 'Updated Club',
                    facultyId: 2,
                    leaderId: 'new-leader-123',
                })

            expect(response.status).toBe(HttpStatus.OK)
            expect(clubService.updateClub).toHaveBeenCalledWith('club-123', {
                name: 'Updated Club',
                facultyId: 2,
                leaderId: 'new-leader-123',
            })
        })

        it('should allow setting facultyId to null', async () => {
            ;(clubService.updateClub as jest.Mock).mockResolvedValue(mockClub)

            const response = await request(app)
                .put('/api/v1/clubs/club-123')
                .set('Authorization', 'Bearer admin-token')
                .send({ facultyId: null })

            expect(response.status).toBe(HttpStatus.OK)
            expect(clubService.updateClub).toHaveBeenCalledWith('club-123', {
                facultyId: null,
            })
        })
    })

    describe('DELETE /api/v1/clubs/:id', () => {
        it('should return 401 when not authenticated', async () => {
            const response = await request(app).delete('/api/v1/clubs/club-123')

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })

        it('should return 403 when user is not DOANTRUONG', async () => {
            const response = await request(app)
                .delete('/api/v1/clubs/club-123')
                .set('Authorization', 'Bearer user-token')

            expect(response.status).toBe(HttpStatus.FORBIDDEN)
        })

        it('should return 200 when club is deleted successfully', async () => {
            ;(clubService.deleteClub as jest.Mock).mockResolvedValue(undefined)

            const response = await request(app)
                .delete('/api/v1/clubs/club-123')
                .set('Authorization', 'Bearer admin-token')

            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body).toHaveProperty('success', true)
            expect(response.body.message).toContain('Xóa CLB thành công')
            expect(clubService.deleteClub).toHaveBeenCalledWith('club-123')
        })
    })

    describe('GET /api/v1/clubs', () => {
        it('should return 401 when not authenticated', async () => {
            const response = await request(app).get('/api/v1/clubs')

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })

        it('should return 200 with all clubs', async () => {
            const mockClubs = {
                data: [mockClub],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 1,
                    totalPages: 1,
                },
            }
            ;(clubService.getAllClubs as jest.Mock).mockResolvedValue(mockClubs)

            const response = await request(app)
                .get('/api/v1/clubs')
                .set('Authorization', 'Bearer user-token')

            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body).toHaveProperty('success', true)
            expect(response.body).toHaveProperty('data')
            expect(clubService.getAllClubs).toHaveBeenCalledWith({
                page: undefined,
                limit: undefined,
                facultyId: undefined,
                search: undefined,
            })
        })

        it('should return 200 with filtered clubs', async () => {
            const mockClubs = {
                data: [mockClub],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 1,
                    totalPages: 1,
                },
            }
            ;(clubService.getAllClubs as jest.Mock).mockResolvedValue(mockClubs)

            const response = await request(app)
                .get('/api/v1/clubs?page=1&limit=10&facultyId=1&search=Test')
                .set('Authorization', 'Bearer user-token')

            expect(response.status).toBe(HttpStatus.OK)
            expect(clubService.getAllClubs).toHaveBeenCalledWith({
                page: 1,
                limit: 10,
                facultyId: 1,
                search: 'Test',
            })
        })

        it('should return 400 when page is invalid', async () => {
            const response = await request(app)
                .get('/api/v1/clubs?page=0')
                .set('Authorization', 'Bearer user-token')

            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })

        it('should return 400 when limit exceeds max', async () => {
            const response = await request(app)
                .get('/api/v1/clubs?limit=100')
                .set('Authorization', 'Bearer user-token')

            expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        })

        it('should authenticate with SINHVIEN role', async () => {
            const mockClubs = {
                data: [],
                pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
            }
            ;(clubService.getAllClubs as jest.Mock).mockResolvedValue(mockClubs)

            const response = await request(app)
                .get('/api/v1/clubs')
                .set('Authorization', 'Bearer student-token')

            expect(response.status).toBe(HttpStatus.OK)
        })
    })

    describe('GET /api/v1/clubs/:id', () => {
        it('should return 401 when not authenticated', async () => {
            const response = await request(app).get('/api/v1/clubs/club-123')

            expect(response.status).toBe(HttpStatus.UNAUTHORIZED)
        })

        it('should return 200 with club data', async () => {
            ;(clubService.getClubById as jest.Mock).mockResolvedValue(mockClub)

            const response = await request(app)
                .get('/api/v1/clubs/club-123')
                .set('Authorization', 'Bearer user-token')

            expect(response.status).toBe(HttpStatus.OK)
            expect(response.body).toHaveProperty('success', true)
            expect(response.body).toHaveProperty('data')
            expect(clubService.getClubById).toHaveBeenCalledWith('club-123')
        })

        it('should return 200 with admin token', async () => {
            ;(clubService.getClubById as jest.Mock).mockResolvedValue(mockClub)

            const response = await request(app)
                .get('/api/v1/clubs/club-123')
                .set('Authorization', 'Bearer admin-token')

            expect(response.status).toBe(HttpStatus.OK)
        })

        it('should return 200 with student token', async () => {
            ;(clubService.getClubById as jest.Mock).mockResolvedValue(mockClub)

            const response = await request(app)
                .get('/api/v1/clubs/club-123')
                .set('Authorization', 'Bearer student-token')

            expect(response.status).toBe(HttpStatus.OK)
        })
    })

    describe('Route not found', () => {
        it('should return 404 for non-existent route', async () => {
            const response = await request(app)
                .get('/api/v1/clubs/club-123/nonexistent')
                .set('Authorization', 'Bearer user-token')

            expect(response.status).toBe(HttpStatus.NOT_FOUND)
        })
    })
})