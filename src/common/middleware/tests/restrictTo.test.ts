import { describe, expect, it, jest } from '@jest/globals'
import { restrictTo } from '../restrictTo'

describe('restrictTo', () => {
    const res = {} as any

    it('allows student account type through SINHVIEN alias', () => {
        const next = jest.fn()
        const middleware = restrictTo('SINHVIEN')
        const req = {
            payload: {
                accountType: 'STUDENT',
                role: 'SINHVIEN',
            },
        } as any

        middleware(req, res, next)

        expect(next).toHaveBeenCalledWith()
    })

    it('blocks users without a matching role or account type', () => {
        const next = jest.fn()
        const middleware = restrictTo('DOANTRUONG')
        const req = {
            payload: {
                accountType: 'STUDENT',
                role: 'SINHVIEN',
            },
        } as any

        middleware(req, res, next)

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 403 })
        )
    })
})
