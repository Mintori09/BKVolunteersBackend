import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const forgotPasswordSchema: RequestValidationSchema = {
    body: z.object({
        email: z
            .string()
            .min(1, 'Email không được để trống')
            .email('Email không hợp lệ'),
    }),
}

export const verifyCodeSchema: RequestValidationSchema = {
    body: z.object({
        email: z
            .string()
            .min(1, 'Email không được để trống')
            .email('Email không hợp lệ'),
        code: z
            .string()
            .min(1, 'Mã xác thực không được để trống')
            .length(6, 'Mã xác thực phải gồm 6 ký tự'),
    }),
}

export const resetPasswordSchema: RequestValidationSchema = {
    body: z
        .object({
            resetToken: z
                .string()
                .min(1, 'Token không được để trống'),
            newPassword: z
                .string()
                .min(1, 'Mật khẩu mới không được để trống')
                .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
                .max(50, 'Mật khẩu không được vượt quá 50 ký tự'),
            newPasswordConfirm: z
                .string()
                .min(1, 'Xác nhận mật khẩu không được để trống'),
        })
        .refine((data) => data.newPassword === data.newPasswordConfirm, {
            message: 'Mật khẩu xác nhận không khớp',
            path: ['newPasswordConfirm'],
        }),
}
