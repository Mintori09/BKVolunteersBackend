import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

// ============================================
// AUTH VALIDATION SCHEMAS
// ============================================

/**
 * Đăng nhập
 * - identifier: email hoặc MSSV (9 số bắt đầu bằng 1)
 * - password: 6-50 ký tự
 */
const mssvRegex = /^1\d{8}$/

export const loginSchema: RequestValidationSchema = {
    body: z.object({
        identifier: z
            .string()
            .min(1, 'Email hoặc MSSV là bắt buộc')
            .max(255, 'Email hoặc MSSV không được quá 255 ký tự')
            .refine(
                (val) =>
                    mssvRegex.test(val) ||
                    z.string().email().safeParse(val).success,
                {
                    message: 'Phải là email hợp lệ hoặc MSSV (9 số bắt đầu bằng 1)',
                }
            ),
        password: z
            .string()
            .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
            .max(50, 'Mật khẩu không được quá 50 ký tự'),
    }),
}

export const refreshSchema: RequestValidationSchema = {
    body: z.object({
        refresh_token: z.string().min(1, 'Refresh token là bắt buộc'),
    }),
}

export const logoutSchema: RequestValidationSchema = {
    body: z.object({
        refresh_token: z.string().min(1, 'Refresh token là bắt buộc'),
    }),
}

/**
 * Đổi mật khẩu
 * - oldPassword: mật khẩu hiện tại (8-150 ký tự)
 * - newPassword: mật khẩu mới (8-150 ký tự)
 * - newPasswordConfirm: xác nhận mật khẩu mới (phải khớp với newPassword)
 */
export const changePasswordSchema: RequestValidationSchema = {
    body: z
        .object({
            oldPassword: z
                .string()
                .min(8, 'Mật khẩu cũ phải có ít nhất 8 ký tự')
                .max(150, 'Mật khẩu cũ không được quá 150 ký tự'),
            newPassword: z
                .string()
                .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
                .max(150, 'Mật khẩu mới không được quá 150 ký tự'),
            newPasswordConfirm: z
                .string()
                .min(8, 'Xác nhận mật khẩu phải có ít nhất 8 ký tự')
                .max(150, 'Xác nhận mật khẩu không được quá 150 ký tự'),
        })
        .refine((data) => data.newPassword === data.newPasswordConfirm, {
            message: 'Mật khẩu xác nhận không khớp',
            path: ['newPasswordConfirm'],
        }),
}
