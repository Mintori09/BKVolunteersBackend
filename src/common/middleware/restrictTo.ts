import { NextFunction, Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import logger from './logger'

/**
 * Middleware to restrict access based on user roles.
 * @param roles - Array of allowed roles.
 */
export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.payload || !roles.includes(req.payload.role)) {
            logger.warn(
                `Denied role access userId=${req.payload?.userId ?? 'anonymous'} role=${req.payload?.role ?? 'unknown'} allowed=${roles.join(',')} method=${req.method} path=${req.originalUrl}`
            )
            return next(
                new ApiError(
                    HttpStatus.FORBIDDEN,
                    'Ban khong duoc phep thuc hien thao tac nay'
                )
            )
        }

        next()
    }
}
