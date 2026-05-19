import { NextFunction, Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'

/**
 * Middleware to restrict access based on user roles.
 * @param roles - Array of allowed roles.
 */
export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const role = req.payload?.role
        const accountType = req.payload?.accountType
        const hasAccess =
            !!req.payload &&
            roles.some(
                (allowed) =>
                    allowed === role ||
                    allowed === accountType ||
                    (allowed === 'SINHVIEN' && accountType === 'STUDENT') ||
                    (allowed === 'OPERATOR' && accountType === 'OPERATOR')
            )

        if (!hasAccess) {
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
