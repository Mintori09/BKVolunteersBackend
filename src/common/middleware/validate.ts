import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'
import { NextFunction, Response, Request } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'

const validate = (schema: RequestValidationSchema) => {
    const combinedSchema = z.object(schema as any)

    return (req: Request, res: Response, next: NextFunction) => {
        const result = combinedSchema.safeParse({
            body: req.body ?? {},
            query: req.query ?? {},
            params: req.params ?? {},
        })

        if (result.success) {
            return next()
        }

        const errors = result.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
        }))

        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Validation failed',
            true,
            errors
        )
    }
}

export default validate
