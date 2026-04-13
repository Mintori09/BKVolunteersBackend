import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const signupSchema: RequestValidationSchema = {
    body: z.object({
        firstName: z.string().min(2).max(50),
        lastName: z.string().min(2).max(50),
        email: z.string().email('Email is not valid!').endsWith('dut.udn.vn'),
        password: z.string().min(8).max(150),
        username: z.string().min(2).max(50),
    }),
}

export const loginSchema: RequestValidationSchema = {
    body: z.object({
        username: z.string().min(1).max(255),
        password: z.string().min(1).max(150),
    }),
}

export const managerLoginSchema: RequestValidationSchema = {
    body: z.object({
        identifier: z.string().min(1).max(255),
        password: z.string().min(1).max(150),
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
