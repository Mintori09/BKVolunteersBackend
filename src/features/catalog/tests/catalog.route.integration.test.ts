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
        username: userId,
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

describe('Catalog-backed Routes Integration', () => {
    it('returns public campaigns with pagination metadata', async () => {
        const response = await request(app).get(
            '/api/v1/public/campaigns?limit=2'
        )

        expect(response.status).toBe(HttpStatus.OK)
        expect(response.body.data.items).toHaveLength(2)
        expect(response.body.data.pagination.total).toBeGreaterThan(1)
    })

    it('returns organization cards and public organization detail', async () => {
        const listResponse = await request(app).get('/api/v1/organizations')

        expect(listResponse.status).toBe(HttpStatus.OK)
        expect(listResponse.body.data.items.length).toBeGreaterThan(0)

        const detailResponse = await request(app).get(
            '/api/v1/organizations/clb-tinh-nguyen-cntt'
        )

        expect(detailResponse.status).toBe(HttpStatus.OK)
        expect(detailResponse.body.data).toEqual(
            expect.objectContaining({
                slug: 'clb-tinh-nguyen-cntt',
                campaigns: expect.any(Array),
            })
        )
    })

    it('requires authentication for managed campaigns and returns the list for authenticated users', async () => {
        const unauthorized = await request(app).get('/api/v1/campaigns')

        expect(unauthorized.status).toBe(HttpStatus.UNAUTHORIZED)

        const forbidden = await request(app)
            .get('/api/v1/campaigns')
            .set('Authorization', 'Bearer student-token')

        expect(forbidden.status).toBe(HttpStatus.FORBIDDEN)

        const authorized = await request(app)
            .get('/api/v1/campaigns')
            .set('Authorization', 'Bearer doantruong-token')

        expect(authorized.status).toBe(HttpStatus.OK)
        expect(authorized.body.data.items.length).toBeGreaterThan(0)
    })

    it('returns student dashboard data for authenticated users', async () => {
        const response = await request(app)
            .get('/api/v1/students/me/dashboard')
            .set('Authorization', 'Bearer student-token')

        expect(response.status).toBe(HttpStatus.OK)
        expect(response.body.data).toEqual(
            expect.objectContaining({
                campaigns_count: expect.any(Number),
                event_hours: expect.any(Number),
                recent_activities: expect.any(Array),
            })
        )
    })

    it('returns reports and approval queue for school board accounts', async () => {
        const overviewResponse = await request(app)
            .get('/api/v1/reports/school/overview')
            .set('Authorization', 'Bearer doantruong-token')

        expect(overviewResponse.status).toBe(HttpStatus.OK)
        expect(overviewResponse.body.data).toEqual(
            expect.objectContaining({
                total_campaigns: expect.any(Number),
                organization_breakdown: expect.any(Array),
            })
        )

        const approvalsResponse = await request(app)
            .get('/api/v1/approvals/campaigns')
            .set('Authorization', 'Bearer doantruong-token')

        expect(approvalsResponse.status).toBe(HttpStatus.OK)
        expect(approvalsResponse.body.data.length).toBeGreaterThan(0)
    })
})
