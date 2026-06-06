import request from 'supertest'
import app from 'src/app'
import { HttpStatus } from 'src/common/constants'
import * as authService from 'src/features/auth/auth.service'
import * as storageService from '../storage.service'

jest.mock('../storage.service')
jest.mock('src/features/auth/auth.service')
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn((token: string) => {
        if (token === 'valid-token') {
            return { userId: 'user-123', role: 'LCD' }
        }

        throw new Error('Invalid token')
    }),
}))

const mockUser = {
    id: 'user-123',
    username: 'manager01',
    email: 'manager@example.com',
    firstName: 'Manager',
    lastName: 'One',
    role: 'LCD' as const,
    facultyId: null,
    status: 'ACTIVE' as const,
    passwordHash: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
}

describe('Storage Routes Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        ;(authService.getUserById as jest.Mock).mockResolvedValue(mockUser)
    })

    it('uploads a file through the authenticated storage endpoint', async () => {
        ;(storageService.uploadFile as jest.Mock).mockResolvedValue({
            id: 'file-1',
            bucketName: 'public-assets',
            storageKey: 'manual-test/image/2026/06/user-123/abc-avatar.png',
            visibility: 'PUBLIC',
            originalName: 'avatar.png',
            mimeType: 'image/png',
            fileSize: 4,
            extension: '.png',
            checksumSha256: 'abc123',
            publicUrl: 'https://example.com/public/avatar.png',
            accessUrl: 'https://example.com/public/avatar.png',
            accessUrlExpiresIn: null,
            accessUrlExpiresAt: null,
            createdAt: new Date().toISOString(),
        })

        const response = await request(app)
            .post('/api/v1/storage/upload')
            .set('Authorization', 'Bearer valid-token')
            .field('kind', 'image')
            .field('folder', 'manual-test')
            .attach('file', Buffer.from('test'), {
                filename: 'avatar.png',
                contentType: 'image/png',
            })

        expect(response.status).toBe(HttpStatus.CREATED)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toEqual(
            expect.objectContaining({
                id: 'file-1',
                bucketName: 'public-assets',
                visibility: 'PUBLIC',
            })
        )
        expect(storageService.uploadFile).toHaveBeenCalledWith(
            expect.objectContaining({
                kind: 'image',
                folder: 'manual-test',
                userId: 'user-123',
                role: 'LCD',
                file: expect.objectContaining({
                    originalname: 'avatar.png',
                    mimetype: 'image/png',
                }),
            })
        )
    })

    it('returns 400 when file is missing', async () => {
        const response = await request(app)
            .post('/api/v1/storage/upload')
            .set('Authorization', 'Bearer valid-token')
            .field('kind', 'image')

        expect(response.status).toBe(HttpStatus.BAD_REQUEST)
        expect(response.body.success).toBe(false)
    })

    it('returns a signed or public access URL for a stored file', async () => {
        ;(storageService.getFileAccessUrl as jest.Mock).mockResolvedValue({
            id: 'file-2',
            originalName: 'evidence.pdf',
            visibility: 'PRIVATE',
            publicUrl: null,
            accessUrl: 'https://example.com/signed/evidence.pdf',
            accessUrlExpiresIn: 3600,
            accessUrlExpiresAt: '2026-06-06T10:00:00.000Z',
            createdAt: '2026-06-06T09:00:00.000Z',
        })

        const response = await request(app)
            .get('/api/v1/storage/files/file-2/access-url')
            .set('Authorization', 'Bearer valid-token')

        expect(response.status).toBe(HttpStatus.OK)
        expect(response.body.success).toBe(true)
        expect(response.body.data).toEqual(
            expect.objectContaining({
                id: 'file-2',
                visibility: 'PRIVATE',
                accessUrl: 'https://example.com/signed/evidence.pdf',
            })
        )
    })
})
