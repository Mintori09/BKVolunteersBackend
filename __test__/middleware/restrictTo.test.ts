import { Request, Response, NextFunction } from 'express'
import { restrictTo } from 'src/common/middleware/restrictTo'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'

describe('restrictTo middleware', () => {
    let req: any
    let res: any
    let next: NextFunction

    beforeEach(() => {
        req = {
            payload: {
                userId: '1',
                role: 'SINHVIEN',
            },
        }
        res = {}
        next = jest.fn()
    })

    it('should allow access if user has the correct role', () => {
        const middleware = restrictTo('SINHVIEN', 'DOANTRUONG')
        middleware(req as Request, res as Response, next)

        expect(next).toHaveBeenCalledWith()
        expect(next).not.toHaveBeenCalledWith(expect.any(ApiError))
    })

    it('should call next with ApiError (403) if user has incorrect role', () => {
        const middleware = restrictTo('DOANTRUONG')
        middleware(req as Request, res as Response, next)

        expect(next).toHaveBeenCalledWith(expect.any(ApiError))
        const error = (next as jest.Mock).mock.calls[0][0]
        expect(error.statusCode).toBe(HttpStatus.FORBIDDEN)
        expect(error.message).toBe(
            'You do not have permission to perform this action'
        )
    })

    it('should call next with ApiError (403) if req.payload is missing', () => {
        req.payload = undefined
        const middleware = restrictTo('SINHVIEN')
        middleware(req as Request, res as Response, next)

        expect(next).toHaveBeenCalledWith(expect.any(ApiError))
        const error = (next as jest.Mock).mock.calls[0][0]
        expect(error.statusCode).toBe(HttpStatus.FORBIDDEN)
    })

    it('should allow access for multi-role support', () => {
        req.payload.role = 'DOANTRUONG'
        const middleware = restrictTo('SINHVIEN', 'DOANTRUONG', 'LCD')
        middleware(req as Request, res as Response, next)

        expect(next).toHaveBeenCalledWith()
    })
})
