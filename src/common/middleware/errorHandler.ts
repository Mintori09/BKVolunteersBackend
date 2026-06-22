import { Response, Request, NextFunction } from 'express'
import { config } from 'src/config'
import { HttpStatus } from 'src/common/constants'
import logger from './logger'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'

export const errorHandler = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let { statusCode, message } = err

    if (!(err instanceof ApiError)) {
        statusCode = err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR
        message = err.message || 'Internal Server Error'
    }

    res.locals.errorMessage = err.message

    const errors = err.errors || null
    const stack = config.node_env === 'development' ? err.stack : undefined

    if (config.node_env === 'development' || statusCode >= 500) {
        logger.error(err)
    }

    ApiResponse.error(res, message, statusCode, errors, stack)
}
