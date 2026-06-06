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
import {
    createCampaignModule,
    createManagedCampaign,
    publishCampaign,
    submitCampaignReview,
    transitionApproval,
    resetManagedCampaignStore,
} from '../campaigns.service'
import { resetEventStore } from 'src/features/events/events.service'

describe('Campaign runtime fallback integration', () => {
    beforeEach(() => {
        resetManagedCampaignStore()
        resetEventStore()
    })

    it('exposes newly created managed campaigns to events, public detail and reports', async () => {
        const createdCampaign = createManagedCampaign({
            title: 'Chien dich cong dong moi',
            summary: 'Tom tat chien dich moi',
            description: 'Mo ta cho campaign vua tao',
            scope_type: 'PUBLIC',
            start_at: '2026-08-01T00:00:00.000Z',
            end_at: '2026-08-10T00:00:00.000Z',
        })

        const createdModule = createCampaignModule(createdCampaign.id, {
            type: 'event',
            title: 'Su kien moi',
            description: 'Module event vua tao',
            start_at: '2026-08-01T00:00:00.000Z',
            end_at: '2026-08-02T00:00:00.000Z',
            settings: {
                location: 'San truong B1',
                quota: 25,
                registration_required: true,
                checkin_required: true,
                benefits: ['Chung nhan'],
            },
        })

        submitCampaignReview(createdCampaign.id)
        transitionApproval(createdCampaign.id, 'pre-approve', 'DOANTRUONG')
        transitionApproval(createdCampaign.id, 'approve', 'DOANTRUONG')
        publishCampaign(createdCampaign.id, 'LCD')

        const eventResponse = await request(app)
            .get(`/api/v1/events/modules/${createdModule?.id}`)
            .set('Authorization', 'Bearer student-token')

        expect(eventResponse.status).toBe(HttpStatus.OK)
        expect(eventResponse.body.data).toEqual(
            expect.objectContaining({
                id: createdModule?.id,
                campaign_id: createdCampaign.id,
            })
        )

        const publicResponse = await request(app).get(
            '/api/v1/public/campaigns/chien-dich-cong-dong-moi'
        )

        expect(publicResponse.status).toBe(HttpStatus.OK)
        expect(publicResponse.body.data).toEqual(
            expect.objectContaining({
                id: createdCampaign.id,
                slug: 'chien-dich-cong-dong-moi',
                modules: expect.arrayContaining([
                    expect.objectContaining({
                        id: createdModule?.id,
                    }),
                ]),
            })
        )

        const reportResponse = await request(app)
            .get(`/api/v1/reports/campaigns/${createdCampaign.id}`)
            .set('Authorization', 'Bearer doantruong-token')

        expect(reportResponse.status).toBe(HttpStatus.OK)
        expect(reportResponse.body.data.campaign).toEqual(
            expect.objectContaining({
                title: 'Chien dich cong dong moi',
                slug: 'chien-dich-cong-dong-moi',
            })
        )

        const reconciliationResponse = await request(app)
            .get(`/api/v1/reports/campaigns/${createdCampaign.id}/reconciliation`)
            .set('Authorization', 'Bearer doantruong-token')

        expect(reconciliationResponse.status).toBe(HttpStatus.OK)
        expect(reconciliationResponse.body.data.reconciliation).toEqual(
            expect.objectContaining({
                matched_transactions: 0,
                verified_amount: 0,
            })
        )
    })
})
