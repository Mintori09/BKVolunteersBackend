import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const loginSchema: RequestValidationSchema = {
    body: z.object({
        email: z.string().email('Email is not valid!').endsWith('dut.udn.vn'),
        password: z.string().min(6).max(150),
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
