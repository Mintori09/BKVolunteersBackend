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

describe('Admin Organizations Routes Integration', () => {
    it('requires DOANTRUONG role to list admin organizations', async () => {
        const unauthorized = await request(app).get(
            '/api/v1/admin/organizations'
        )
        expect(unauthorized.status).toBe(HttpStatus.UNAUTHORIZED)

        const forbidden = await request(app)
            .get('/api/v1/admin/organizations')
            .set('Authorization', 'Bearer student-token')
        expect(forbidden.status).toBe(HttpStatus.FORBIDDEN)
    })

    it('returns admin organizations list for DOANTRUONG', async () => {
        const response = await request(app)
            .get('/api/v1/admin/organizations')
            .set('Authorization', 'Bearer doantruong-token')

        expect(response.status).toBe(HttpStatus.OK)
        expect(response.body.data.items.length).toBeGreaterThan(0)
        expect(response.body.data.items[0]).toEqual(
            expect.objectContaining({
                id: expect.any(String),
                code: expect.any(String),
                created_at: expect.any(String),
            })
        )
    })

    it('creates, updates, lists and deletes a managed organization', async () => {
        const suffix = Date.now().toString()
        const initialName = `Cau lac bo Moi ${suffix}`
        const updatedName = `Cau lac bo Moi Cap Nhat ${suffix}`
        const initialSlug = `cau-lac-bo-moi-${suffix}`
        const updatedSlug = `cau-lac-bo-moi-cap-nhat-${suffix}`
        const createResponse = await request(app)
            .post('/api/v1/admin/organizations')
            .set('Authorization', 'Bearer doantruong-token')
            .send({
                code: `BKV-${suffix}`,
                name: initialName,
                type: 'CLUB',
                status: 'ACTIVE',
                description: 'Don vi vua duoc tao',
            })

        expect(createResponse.status).toBe(HttpStatus.CREATED)
        expect(createResponse.body.data).toEqual(
            expect.objectContaining({
                code: `BKV-${suffix}`,
                slug: initialSlug,
            })
        )

        const organizationId = createResponse.body.data.id

        const publicDetail = await request(app).get(
            `/api/v1/organizations/${initialSlug}`
        )
        expect(publicDetail.status).toBe(HttpStatus.OK)
        expect(publicDetail.body.data.name).toBe(initialName)

        const updateResponse = await request(app)
            .patch(`/api/v1/admin/organizations/${organizationId}`)
            .set('Authorization', 'Bearer doantruong-token')
            .send({
                name: updatedName,
                description: 'Da cap nhat',
            })

        expect(updateResponse.status).toBe(HttpStatus.OK)
        expect(updateResponse.body.data).toEqual(
            expect.objectContaining({
                name: updatedName,
                slug: updatedSlug,
            })
        )

        const filteredResponse = await request(app)
            .get('/api/v1/admin/organizations?q=cap%20nhat')
            .set('Authorization', 'Bearer doantruong-token')
        expect(filteredResponse.status).toBe(HttpStatus.OK)
        expect(filteredResponse.body.data.items).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: organizationId,
                }),
            ])
        )

        const deleteResponse = await request(app)
            .delete(`/api/v1/admin/organizations/${organizationId}`)
            .set('Authorization', 'Bearer doantruong-token')
        expect(deleteResponse.status).toBe(HttpStatus.OK)

        const afterDelete = await request(app)
            .get('/api/v1/admin/organizations?q=cap%20nhat')
            .set('Authorization', 'Bearer doantruong-token')
        expect(afterDelete.body.data.items).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: organizationId,
                }),
            ])
        )
    })
})
