import { HttpStatus } from 'src/common/constants/http-status'

export class ApiError extends Error {
    public readonly statusCode: number
    public readonly isOperational: boolean
    public readonly errors: any

    constructor(
        statusCode: number,
        message: string,
        isOperational = true,
        errors: any = null,
        stack = ''
    ) {
        super(message)
        this.statusCode = statusCode
        this.isOperational = isOperational
        this.errors = errors
        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}
