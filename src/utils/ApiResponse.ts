import { Response } from 'express'
import { HttpStatus } from 'src/common/constants/http-status'

export class ApiResponse {
    static success(
        res: Response,
        data: any,
        message = 'Success',
        statusCode = HttpStatus.OK
    ) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        })
    }

    static error(
        res: Response,
        message = 'Error',
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
        errors: any = null,
        stack: string | undefined = undefined
    ) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors,
            ...(stack && { stack }),
        })
    }
}
