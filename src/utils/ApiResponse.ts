import { Response } from 'express'
import { HttpStatus } from 'src/common/constants/http-status'

export interface ApiResponseSuccess<T> {
    success: true
    message: string
    data: T
    meta?: unknown
}

export interface ApiResponseError {
    success: false
    error: {
        code: string
        message: string
        details?: unknown
    }
    stack?: string
}

export class ApiResponse {
    static success<T>(
        res: Response,
        data: T,
        message = 'Success',
        statusCode = HttpStatus.OK,
        meta?: unknown
    ) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            ...(meta !== undefined ? { meta } : {}),
        } satisfies ApiResponseSuccess<T>)
    }

    static error(
        res: Response,
        message = 'Error',
        statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
        details: unknown = undefined,
        code = 'INTERNAL_ERROR',
        stack: string | undefined = undefined
    ) {
        return res.status(statusCode).json({
            success: false,
            error: {
                code,
                message,
                ...(details !== undefined && { details }),
            },
            ...(stack && { stack }),
        } satisfies ApiResponseError)
    }
}
