import request from 'supertest'

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(() => ({ userId: 'student-user', role: 'SINHVIEN' })),
}))

jest.mock('src/features/auth/auth.service', () => ({
    getUserById: jest.fn(async (userId: string, role?: string) => ({
        id: userId,
        username: userId,
        email: `${userId}@example.com`,
        firstName: 'Sinh',
        lastName: 'Vien',
        role: role ?? 'SINHVIEN',
        status: 'ACTIVE',
        passwordHash: 'hashed',
        facultyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    })),
}))

import app from 'src/app'
import { HttpStatus } from 'src/common/constants'

describe('Notifications Routes Integration', () => {
    it('lists notifications for authenticated users', async () => {
        const response = await request(app)
            .get('/api/v1/notifications')
            .set('Authorization', 'Bearer student-token')

        expect(response.status).toBe(HttpStatus.OK)
        expect(response.body.data.items.length).toBeGreaterThan(0)
        expect(response.body.data.meta).toEqual(
            expect.objectContaining({
                total: expect.any(Number),
                page: 1,
            })
        )
    })

    it('marks one notification as read', async () => {
        const response = await request(app)
            .patch('/api/v1/notifications/notification-1/read')
            .set('Authorization', 'Bearer student-token')

        expect(response.status).toBe(HttpStatus.OK)
        expect(response.body.data).toEqual(
            expect.objectContaining({
                id: 'notification-1',
                read_at: expect.any(String),
            })
        )
    })

    it('marks all notifications as read', async () => {
        const response = await request(app)
            .patch('/api/v1/notifications/read-all')
            .set('Authorization', 'Bearer student-token')

        expect(response.status).toBe(HttpStatus.OK)
        expect(response.body.data.count).toBeGreaterThan(0)
    })
})
