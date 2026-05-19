export class ApiError extends Error {
    public readonly statusCode: number
    public readonly code: string
    public readonly isOperational: boolean
    public readonly errors: any

    constructor(
        statusCode: number,
        message: string,
        codeOrOperational: string | boolean = 'INTERNAL_ERROR',
        isOperationalOrErrors: boolean | unknown = true,
        errors: any = null,
        stack = ''
    ) {
        super(message)
        const isLegacySignature = typeof codeOrOperational === 'boolean'
        this.statusCode = statusCode
        this.code = isLegacySignature ? 'REQUEST_ERROR' : codeOrOperational
        this.isOperational = isLegacySignature
            ? codeOrOperational
            : (isOperationalOrErrors as boolean)
        this.errors = isLegacySignature ? isOperationalOrErrors : errors
        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}
