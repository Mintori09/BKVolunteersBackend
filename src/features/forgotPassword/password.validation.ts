import { RequestValidationSchema } from 'src/types/request'
import * as z from 'zod'

export const forgotPasswordSchema: RequestValidationSchema = {
    body: z.object({
        email: z.string().email('Email is not valid'),
    }),
}

export const resetPasswordSchema = {
    body: z.object({
        newPassword: z.string().min(6).max(150),
    }),
    params: z.object({
        token: z
            .string()
            .regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/),
    }),
}
