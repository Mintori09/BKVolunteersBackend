import { NextFunction, Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'

/**
 * Middleware to restrict access based on user roles.
 * @param roles - Array of allowed roles.
 */
export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.payload || !roles.includes(req.payload.role)) {
            return next(
                new ApiError(
                    HttpStatus.FORBIDDEN,
                    'You do not have permission to perform this action'
                )
            )
        }

        next()
    }
}
