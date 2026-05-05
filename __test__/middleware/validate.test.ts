import { Response, Request, NextFunction } from 'express'
import validate from 'src/common/middleware/validate'
import { HttpStatus } from 'src/common/constants'
import * as z from 'zod'
import { ApiError } from 'src/utils/ApiError'

describe('validate middleware', () => {
    let req: any
    let res: any
    let next: NextFunction

    const schema = {
        body: z.object({
            email: z.string().email(),
        }),
    }

    beforeEach(() => {
        req = {
            body: {},
            query: {},
            params: {},
        }
        res = {}
        next = jest.fn()
    })

    it('should call next() if validation passes', () => {
        req.body = { email: 'test@example.com' }
        const middleware = validate(schema)
        middleware(req as Request, res as Response, next)

        expect(next).toHaveBeenCalledWith()
    })

    it('should throw ApiError if validation fails', () => {
        req.body = { email: 'invalid-email' }
        const middleware = validate(schema)

        expect(() => {
            middleware(req as Request, res as Response, next)
        }).toThrow(ApiError)

        try {
            middleware(req as Request, res as Response, next)
        } catch (error: any) {
            expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST)
            expect(error.message).toBe('Validation failed')
            expect(error.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'body.email' }),
                ])
            )
        }
    })

    it('should handle multiple validation errors', () => {
        const multiSchema = {
            body: z.object({
                email: z.string().email(),
                age: z.number().min(18),
            }),
        }
        req.body = { email: 'invalid', age: 10 }
        const middleware = validate(multiSchema)

        try {
            middleware(req as Request, res as Response, next)
        } catch (error: any) {
            expect(error.errors.length).toBe(2)
        }
    })
})
