import { Request, Response, NextFunction } from 'express'
import { SanitizeOptions } from 'src/types/common'
import { sanitize } from 'src/utils/sanitize.util'

export const xssMiddleware = (options?: SanitizeOptions) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (req.body) {
            req.body = sanitize(req.body, options)
        }

        if (req.query) {
            Object.assign(req.query, sanitize(req.query, options))
        }

        if (req.params) {
            Object.assign(req.params, sanitize(req.params, options))
        }

        next()
    }
}
