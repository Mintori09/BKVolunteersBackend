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
import { resetCertificateStore } from '../certificates.service'

describe('Certificates Routes Integration', () => {
    beforeEach(() => {
        resetCertificateStore()
    })

    it('lists student certificates and verifies a certificate publicly', async () => {
        const myCertificates = await request(app)
            .get('/api/v1/students/me/certificates')
            .set('Authorization', 'Bearer student-token')

        expect(myCertificates.status).toBe(HttpStatus.OK)
        expect(myCertificates.body.data.length).toBeGreaterThan(0)

        const verify = await request(app).get(
            '/api/v1/public/certificates/verify/CERT-2026-001'
        )

        expect(verify.status).toBe(HttpStatus.OK)
        expect(verify.body.data).toEqual(
            expect.objectContaining({
                valid: true,
                certificate: expect.objectContaining({
                    certificate_no: 'CERT-2026-001',
                }),
            })
        )
    })

    it('manages templates for school board accounts', async () => {
        const list = await request(app)
            .get('/api/v1/certificates/templates')
            .set('Authorization', 'Bearer doantruong-token')

        expect(list.status).toBe(HttpStatus.OK)
        expect(list.body.data.length).toBeGreaterThan(0)

        const created = await request(app)
            .post('/api/v1/certificates/templates')
            .set('Authorization', 'Bearer doantruong-token')
            .send({
                name: 'Mau test moi',
                type: 'VOLUNTEER',
                layout_json: { version: 1, fields: [] },
            })

        expect(created.status).toBe(HttpStatus.CREATED)
        expect(created.body.data.name).toBe('Mau test moi')
    })

    it('supports campaign certificate actions', async () => {
        const list = await request(app)
            .get('/api/v1/certificates/campaigns/campaign-1')
            .set('Authorization', 'Bearer doantruong-token')

        expect(list.status).toBe(HttpStatus.OK)
        expect(list.body.data.length).toBeGreaterThan(0)

        const generate = await request(app)
            .post('/api/v1/certificates/campaigns/campaign-1/generate')
            .set('Authorization', 'Bearer doantruong-token')
            .send({
                template_id: 'tpl-1',
                dry_run: true,
            })

        expect(generate.status).toBe(HttpStatus.OK)
        expect(generate.body.data).toEqual(
            expect.objectContaining({
                dry_run: true,
                candidate_count: expect.any(Number),
            })
        )

        const render = await request(app)
            .post('/api/v1/certificates/cert-2/render')
            .set('Authorization', 'Bearer doantruong-token')

        expect(render.status).toBe(HttpStatus.OK)

        const revoke = await request(app)
            .post('/api/v1/certificates/cert-2/revoke')
            .set('Authorization', 'Bearer doantruong-token')
            .send({ revoke_reason: 'Sai gio cong' })

        expect(revoke.status).toBe(HttpStatus.OK)
        expect(revoke.body.data.status).toBe('REVOKED')

        const reissue = await request(app)
            .post('/api/v1/certificates/cert-3/reissue')
            .set('Authorization', 'Bearer doantruong-token')

        expect(reissue.status).toBe(HttpStatus.OK)
        expect(reissue.body.data.status).toBe('READY')
    })
})
