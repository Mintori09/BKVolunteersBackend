import { describe, expect, it, jest } from '@jest/globals'
import * as z from 'zod'
import validate from '../validate'

describe('validate middleware', () => {
    it('writes coerced query values back to the request', () => {
        const next = jest.fn()
        const middleware = validate({
            query: z.object({
                page: z.coerce.number().int().min(1),
                limit: z.coerce.number().int().min(1),
            }),
        })
        const req = {
            body: {},
            query: { page: '2', limit: '50' },
            params: {},
        } as any
        const res = {} as any

        middleware(req, res, next)

        expect(req.query).toEqual({ page: 2, limit: 50 })
        expect(next).toHaveBeenCalledWith()
    })
})
