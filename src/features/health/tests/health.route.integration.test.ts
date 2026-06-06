import request from 'supertest'
import app from 'src/app'
import { HttpStatus } from 'src/common/constants'

describe('Health Routes Integration', () => {
    it('returns backend health through the versioned endpoint', async () => {
        const response = await request(app).get('/api/v1/health')

        expect(response.status).toBe(HttpStatus.OK)
        expect(response.body).toHaveProperty('success', true)
        expect(response.body).toHaveProperty('data.status', 'ok')
        expect(response.body).toHaveProperty(
            'data.service',
            'BKVolunteersBackend'
        )
        expect(response.body.data.routes).toEqual(
            expect.arrayContaining([
                '/api/v1/auth',
                '/api/v1/users',
                '/api/v1/locations',
            ])
        )
    })

    it('supports the unversioned api health alias', async () => {
        const response = await request(app).get('/api/health')

        expect(response.status).toBe(HttpStatus.OK)
        expect(response.body).toHaveProperty('success', true)
        expect(response.body).toHaveProperty('data.status', 'ok')
    })
})
