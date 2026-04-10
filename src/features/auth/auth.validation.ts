import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const loginSchema: RequestValidationSchema = {
    body: z.object({
        mssv: z.string().min(9).max(40),
        password: z.string().min(6).max(50),
    }),
}

export const changePasswordSchema: RequestValidationSchema = {
    body: z
        .object({
            oldPassword: z.string().min(8).max(150),
            newPassword: z.string().min(8).max(150),
            newPasswordConfirm: z.string().min(8).max(150),
        })
        .refine((data) => data.newPassword === data.newPasswordConfirm, {
            message: "Passwords don't match",
            path: ['newPasswordConfirm'],
        }),
}
