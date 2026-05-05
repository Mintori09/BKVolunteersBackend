import request from 'supertest'
import app from 'src/app'
import { prismaClient } from 'src/config'

jest.mock('uuid', () => ({
    v4: () => 'test-uuid-1234',
}))

jest.mock('src/config', () => ({
    prismaClient: {},
    config: {
        node_env: 'test',
        server: { port: '4000', url: 'http://localhost:4000' },
        cors: { cors_origin: '*' },
        jwt: {
            access_token: {
                secret: 'test_access_token_secret',
                expire: '20m',
            },
            refresh_token: {
                secret: 'test_refresh_token_secret',
                expire: '1d',
                cookie_name: 'min',
            },
        },
        email: {
            smtp: {
                host: 'localhost',
                port: '587',
                auth: { username: '', password: '' },
            },
            from: 'test@example.com',
        },
        database_url: 'mysql://root:test@localhost:3306/test',
        upload: {
            basePath: '/uploads',
            imagePath: '/uploads/images',
            documentPath: '/uploads/documents',
            staticUrlPrefix: '/files',
        },
    },
    corsConfig: {},
    refreshTokenCookieConfig: {},
    clearRefreshTokenCookieConfig: {},
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
            allowedMimeTypes: [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ],
            allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
            storagePath: '/uploads/documents',
            urlPrefix: '/files/documents',
        },
        basePath: '/uploads',
        staticUrlPrefix: '/files',
    },
    getAbsoluteStoragePath: (path: string) => path,
}))

describe('Upload Controller', () => {
    describe('POST /api/v1/upload/image', () => {
        it('should return 401 when not authenticated', async () => {
            const response = await request(app).post('/api/v1/upload/image')
            expect(response.status).toBe(401)
        })

        it('should return 403 when token is invalid and no file is provided', async () => {
            const response = await request(app)
                .post('/api/v1/upload/image')
                .set('Authorization', 'Bearer valid_token')
            expect(response.status).toBe(403)
        })
    })

    describe('POST /api/v1/upload/document', () => {
        it('should return 401 when not authenticated', async () => {
            const response = await request(app).post('/api/v1/upload/document')
            expect(response.status).toBe(401)
        })
    })

    describe('GET /api/v1/files/images/:filename', () => {
        it('should return 401 when not authenticated', async () => {
            const response = await request(app).get(
                '/api/v1/files/images/test.jpg'
            )
            expect(response.status).toBe(401)
        })
    })

    describe('GET /api/v1/files/documents/:filename', () => {
        it('should return 401 when not authenticated', async () => {
            const response = await request(app).get(
                '/api/v1/files/documents/test.pdf'
            )
            expect(response.status).toBe(401)
        })
    })
})
