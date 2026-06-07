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
} from '../campaigns.service'

describe('Campaign runtime fallback integration', () => {
    it('exposes newly created managed campaigns to events, public detail and reports', async () => {
        const suffix = Date.now().toString()
        const campaignTitle = `Chien dich cong dong moi ${suffix}`
        const campaignSlug = `chien-dich-cong-dong-moi-${suffix}`
        const createdCampaign = await createManagedCampaign(
            {
                title: campaignTitle,
                summary: 'Tom tat chien dich moi',
                description: 'Mo ta cho campaign vua tao',
                scope_type: 'PUBLIC',
                start_at: '2026-08-01T00:00:00.000Z',
                end_at: '2026-08-10T00:00:00.000Z',
            },
            {
                userId: 'lcd-user',
                role: 'LCD',
            }
        )

        const createdModule = await createCampaignModule(
            createdCampaign.id,
            {
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
            },
            {
                userId: 'lcd-user',
                role: 'LCD',
            }
        )

        await submitCampaignReview(createdCampaign.id, 'lcd-user', 'LCD')
        await transitionApproval(
            createdCampaign.id,
            'pre-approve',
            'DOANTRUONG',
            'board-user'
        )
        await transitionApproval(
            createdCampaign.id,
            'approve',
            'DOANTRUONG',
            'board-user'
        )
        await publishCampaign(createdCampaign.id, {
            userId: 'lcd-user',
            role: 'LCD',
        })

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
            `/api/v1/public/campaigns/${campaignSlug}`
        )

        expect(publicResponse.status).toBe(HttpStatus.OK)
        expect(publicResponse.body.data).toEqual(
            expect.objectContaining({
                id: createdCampaign.id,
                slug: campaignSlug,
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
                title: campaignTitle,
                slug: campaignSlug,
            })
        )

        const reconciliationResponse = await request(app)
            .get(
                `/api/v1/reports/campaigns/${createdCampaign.id}/reconciliation`
            )
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
