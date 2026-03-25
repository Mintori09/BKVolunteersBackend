import { Response, Request, NextFunction } from 'express'
import { errorHandler } from 'src/common/middleware/errorHandler'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import logger from 'src/common/middleware/logger'

// Mock logger to avoid actual console/file output during tests
jest.mock('src/common/middleware/logger', () => ({
    error: jest.fn(),
}))

jest.mock('src/config', () => ({
    config: {
        node_env: 'development',
    },
}))

describe('errorHandler middleware', () => {
    let req: any
    let res: any
    let next: NextFunction

    beforeEach(() => {
        req = {}
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            locals: {},
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    it('should handle ApiError and return standardized JSON response', () => {
        const error = new ApiError(HttpStatus.NOT_FOUND, 'Not found')
        errorHandler(error, req as Request, res as Response, next)

        expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: 'Not found',
                stack: expect.any(String),
            })
        )
        expect(logger.error).toHaveBeenCalled()
    })

    it('should handle generic Error and return 500 status code', () => {
        const error = new Error('Generic error')
        errorHandler(error, req as Request, res as Response, next)

        expect(res.status).toHaveBeenCalledWith(
            HttpStatus.INTERNAL_SERVER_ERROR
        )
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: 'Generic error',
            })
        )
    })

    it('should use default error message and status if not provided', () => {
        const error = {}
        errorHandler(error, req as Request, res as Response, next)

        expect(res.status).toHaveBeenCalledWith(
            HttpStatus.INTERNAL_SERVER_ERROR
        )
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: 'Internal Server Error',
            })
        )
    })

    it('should handle ApiError with custom errors property', () => {
        const errors = [{ field: 'email', message: 'invalid' }]
        const error = new ApiError(
            HttpStatus.BAD_REQUEST,
            'Validation failed',
            true,
            errors
        )
        errorHandler(error, req as Request, res as Response, next)

        expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: 'Validation failed',
                errors: errors,
            })
        )
    })

    it('should log 500 errors even in production', () => {
        const config = require('src/config').config
        config.node_env = 'production'

        const error = new Error('Database crash')
        errorHandler(error, req as Request, res as Response, next)

        expect(res.status).toHaveBeenCalledWith(
            HttpStatus.INTERNAL_SERVER_ERROR
        )
        expect(logger.error).toHaveBeenCalled()
    })
})
