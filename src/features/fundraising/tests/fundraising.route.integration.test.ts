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
        username: role === 'DOANTRUONG' ? 'doantruong' : '21118888',
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

describe('Fundraising Routes Integration', () => {
    it('returns fundraising module, donations and transactions for authenticated users', async () => {
        const moduleResponse = await request(app)
            .get('/api/v1/fundraising/modules/module-fundraising-2')
            .set('Authorization', 'Bearer student-token')

        expect(moduleResponse.status).toBe(HttpStatus.OK)
        expect(moduleResponse.body.data).toEqual(
            expect.objectContaining({
                id: 'module-fundraising-2',
                campaign_id: 'campaign-3',
            })
        )

        const donationsResponse = await request(app)
            .get('/api/v1/fundraising/modules/module-fundraising-2/donations')
            .set('Authorization', 'Bearer doantruong-token')

        expect(donationsResponse.status).toBe(HttpStatus.OK)
        expect(donationsResponse.body.data.items.length).toBeGreaterThan(0)

        const transactionsResponse = await request(app)
            .get(
                '/api/v1/fundraising/transactions?module_id=module-fundraising-2'
            )
            .set('Authorization', 'Bearer doantruong-token')

        expect(transactionsResponse.status).toBe(HttpStatus.OK)
        expect(transactionsResponse.body.data.items.length).toBeGreaterThan(0)
    })

    it('supports donate, verify, attach, unmatch and reject actions', async () => {
        const created = await request(app)
            .post('/api/v1/fundraising/modules/module-fundraising-2/donations')
            .set('Authorization', 'Bearer student-token')
            .send({
                amount: 450000,
                donor_name: 'Sinh Vien Test',
                message: 'Ung ho hoc bong dau nam',
            })

        expect(created.status).toBe(HttpStatus.CREATED)
        expect(created.body.data.status).toBe('PENDING')

        const detail = await request(app)
            .get(`/api/v1/fundraising/donations/${created.body.data.id}`)
            .set('Authorization', 'Bearer student-token')

        expect(detail.status).toBe(HttpStatus.OK)
        expect(detail.body.data.payment_instruction).toEqual(
            expect.objectContaining({
                transfer_content: expect.any(String),
            })
        )

        const attach = await request(app)
            .patch(
                '/api/v1/fundraising/transactions/tx-fund-201/attach-donation'
            )
            .set('Authorization', 'Bearer doantruong-token')
            .send({ donation_id: 'donation-201' })

        expect(attach.status).toBe(HttpStatus.OK)
        expect(attach.body.data.match_status).toBe('MATCHED')

        const verify = await request(app)
            .patch('/api/v1/fundraising/donations/donation-201/verify')
            .set('Authorization', 'Bearer doantruong-token')
            .send({
                transaction_id: 'tx-fund-201',
                note: 'Da doi chieu sao ke va noi dung chuyen khoan',
            })

        expect(verify.status).toBe(HttpStatus.OK)
        expect(verify.body.data.status).toBe('VERIFIED')

        const unmatch = await request(app)
            .patch('/api/v1/fundraising/transactions/tx-fund-201/unmatch')
            .set('Authorization', 'Bearer doantruong-token')

        expect(unmatch.status).toBe(HttpStatus.OK)
        expect(unmatch.body.data.match_status).toBe('UNMATCHED')

        const reject = await request(app)
            .patch('/api/v1/fundraising/donations/donation-201/reject')
            .set('Authorization', 'Bearer doantruong-token')
            .send({ reason: 'Can bo sung bien lai ro hon' })

        expect(reject.status).toBe(HttpStatus.OK)
        expect(reject.body.data.status).toBe('REJECTED')
    })
})
