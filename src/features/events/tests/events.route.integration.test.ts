import request from 'supertest'

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn((token: string) => {
        if (token === 'doantruong-token') {
            return { userId: 'board-user', role: 'DOANTRUONG' }
        }

        return { userId: 'student-user', role: 'SINHVIEN' }
    }),
}))

jest.mock('src/features/auth/auth.service', () => ({
    getUserById: jest.fn(async (userId: string, role?: string) => ({
        id: userId,
        username: role === 'DOANTRUONG' ? 'doantruong' : '21119999',
        email: `${userId}@example.com`,
        firstName: role === 'DOANTRUONG' ? 'Doan' : 'Sinh',
        lastName: role === 'DOANTRUONG' ? 'Truong' : 'Vien',
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
import { resetEventStore } from '../events.service'

describe('Events Routes Integration', () => {
    beforeEach(async () => {
        await resetEventStore()
    })

    it('returns event module detail and registrations for authenticated users', async () => {
        const moduleResponse = await request(app)
            .get('/api/v1/events/modules/module-event-3')
            .set('Authorization', 'Bearer student-token')

        expect(moduleResponse.status).toBe(HttpStatus.OK)
        expect(moduleResponse.body.data).toEqual(
            expect.objectContaining({
                id: 'module-event-3',
                campaign_id: 'campaign-3',
                registration_count: expect.any(Number),
            })
        )

        const registrationsResponse = await request(app)
            .get('/api/v1/events/modules/module-event-3/registrations')
            .set('Authorization', 'Bearer doantruong-token')

        expect(registrationsResponse.status).toBe(HttpStatus.OK)
        expect(registrationsResponse.body.data.length).toBeGreaterThan(0)
    })

    it('supports register, approve, reject, check-in and complete actions', async () => {
        const created = await request(app)
            .post('/api/v1/events/modules/module-event-3/registrations')
            .set('Authorization', 'Bearer student-token')
            .send({
                answers: {
                    faculty: 'Khoa CNTT',
                    skills: ['To chuc su kien'],
                },
            })

        expect(created.status).toBe(HttpStatus.CREATED)
        expect(['PENDING', 'APPROVED']).toContain(created.body.data.status)

        const approve = await request(app)
            .patch('/api/v1/events/registrations/registration-evt-3/approve')
            .set('Authorization', 'Bearer doantruong-token')
            .send({ review_note: 'Bo tri nhom le tan' })

        expect(approve.status).toBe(HttpStatus.OK)
        expect(approve.body.data.status).toBe('APPROVED')

        const reject = await request(app)
            .patch('/api/v1/events/registrations/registration-evt-4/reject')
            .set('Authorization', 'Bearer doantruong-token')
            .send({ reason: 'Can bo sung thong tin lich hoc' })

        expect(reject.status).toBe(HttpStatus.OK)
        expect(reject.body.data.status).toBe('REJECTED')

        const checkIn = await request(app)
            .post('/api/v1/events/registrations/registration-evt-3/check-in')
            .set('Authorization', 'Bearer doantruong-token')

        expect(checkIn.status).toBe(HttpStatus.OK)
        expect(checkIn.body.data.status).toBe('CHECKED_IN')

        const complete = await request(app)
            .post('/api/v1/events/registrations/registration-evt-3/complete')
            .set('Authorization', 'Bearer doantruong-token')
            .send({ hours: 3.5, note: 'Hoan thanh ca chieu' })

        expect(complete.status).toBe(HttpStatus.OK)
        expect(complete.body.data.status).toBe('COMPLETED')
    })
})
