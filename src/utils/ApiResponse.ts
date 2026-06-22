import { Response } from 'express'
import { HttpStatus } from 'src/common/constants/http-status'

export interface ApiResponseSuccess<T> {
    success: true
    message: string
    data: T
}

export interface ApiResponseError {
    success: false
    message: string
    errors: any
    stack?: string
}

export class ApiResponse {
    static success<T>(
        res: Response,
        data: T,
        message = 'Success',
        statusCode = HttpStatus.OK
    ) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        } satisfies ApiResponseSuccess<T>)
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
        } satisfies ApiResponseError)
    }
}
