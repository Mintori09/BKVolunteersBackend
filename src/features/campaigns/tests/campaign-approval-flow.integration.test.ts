import request from 'supertest'

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn((token: string) => {
        if (token === 'doantruong-token') {
            return { userId: 'board-user', role: 'DOANTRUONG' }
        }

        if (token === 'lcd-token') {
            return { userId: 'lcd-user', role: 'LCD' }
        }

        return { userId: 'clb-user', role: 'CLB' }
    }),
}))

jest.mock('src/features/auth/auth.service', () => ({
    getUserById: jest.fn(async (userId: string, role?: string) => ({
        id: userId,
        username: role?.toLowerCase() ?? userId,
        email: `${userId}@example.com`,
        firstName: role ?? 'User',
        lastName: 'Test',
        role: role ?? 'CLB',
        status: 'ACTIVE',
        passwordHash: 'hashed',
        facultyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    })),
}))

import app from 'src/app'
import { HttpStatus } from 'src/common/constants'
import { resetManagedCampaignStore } from '../campaigns.service'

describe('Campaign approval flow integration', () => {
    beforeEach(() => {
        resetManagedCampaignStore()
    })

    it('prevents LCD from publishing before DOANTRUONG approval and allows publish after approval', async () => {
        const createdCampaign = await request(app)
            .post('/api/v1/campaigns')
            .set('Authorization', 'Bearer lcd-token')
            .send({
                title: 'Chien dich can duyet',
                summary: 'Tom tat',
                description: 'Mo ta',
                scope_type: 'PUBLIC',
                start_at: '2026-08-01T00:00:00.000Z',
                end_at: '2026-08-10T00:00:00.000Z',
            })

        expect(createdCampaign.status).toBe(HttpStatus.CREATED)
        const campaignId = createdCampaign.body.data.id

        const submitted = await request(app)
            .post(`/api/v1/campaigns/${campaignId}/submit-review`)
            .set('Authorization', 'Bearer lcd-token')

        expect(submitted.status).toBe(HttpStatus.OK)
        expect(submitted.body.data.to_status).toBe('SUBMITTED')

        const publishTooEarly = await request(app)
            .post(`/api/v1/campaigns/${campaignId}/publish`)
            .set('Authorization', 'Bearer lcd-token')

        expect(publishTooEarly.status).toBe(HttpStatus.CONFLICT)

        const queueResponse = await request(app)
            .get('/api/v1/approvals/campaigns')
            .set('Authorization', 'Bearer doantruong-token')

        expect(queueResponse.status).toBe(HttpStatus.OK)
        expect(queueResponse.body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: campaignId,
                    status: 'SUBMITTED',
                }),
            ])
        )

        const preApprove = await request(app)
            .post(`/api/v1/approvals/campaigns/${campaignId}/pre-approve`)
            .set('Authorization', 'Bearer doantruong-token')
            .send({ reason: 'Ho so da dat dieu kien so duyet' })

        expect(preApprove.status).toBe(HttpStatus.OK)
        expect(preApprove.body.data.to_status).toBe('PRE_APPROVED')

        const approve = await request(app)
            .post(`/api/v1/approvals/campaigns/${campaignId}/approve`)
            .set('Authorization', 'Bearer doantruong-token')
            .send({ reason: 'Dong y cong khai chien dich' })

        expect(approve.status).toBe(HttpStatus.OK)
        expect(approve.body.data.to_status).toBe('APPROVED')

        const publishAfterApproval = await request(app)
            .post(`/api/v1/campaigns/${campaignId}/publish`)
            .set('Authorization', 'Bearer lcd-token')

        expect(publishAfterApproval.status).toBe(HttpStatus.OK)
        expect(publishAfterApproval.body.data.status).toBe('PUBLISHED')
    })
})
