import request from 'supertest'
import app from 'src/app'
import { HttpStatus } from 'src/common/constants'

describe('Locations Routes Integration', () => {
    it('returns the location catalog through the versioned API', async () => {
        const response = await request(app).get('/api/v1/locations')

        expect(response.status).toBe(HttpStatus.OK)
        expect(response.body).toHaveProperty('success', true)
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.data[0]).toEqual(
            expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String),
                address: expect.any(String),
                latitude: expect.any(Number),
                longitude: expect.any(Number),
                type: expect.any(String),
                description: expect.any(String),
            })
        )
    })

    it('filters locations by type', async () => {
        const response = await request(app).get('/api/v1/locations?type=campus')

        expect(response.status).toBe(HttpStatus.OK)
        expect(response.body.data).toHaveLength(1)
        expect(response.body.data[0].type).toBe('CAMPUS')
    })

    it('supports the legacy unversioned alias used by the map widget', async () => {
        const response = await request(app).get('/api/locations')

        expect(response.status).toBe(HttpStatus.OK)
        expect(response.body).toHaveProperty('success', true)
        expect(response.body.data.length).toBeGreaterThan(0)
    })
})
