import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

// ============================================
// AUTH VALIDATION SCHEMAS
// ============================================

/**
 * Đăng nhập
 * - username: email hoặc MSSV (9 số bắt đầu bằng 1)
 * - password: 6-50 ký tự
 */
export const loginSchema: RequestValidationSchema = {
    body: z.object({
        username: z
            .string()
            .min(3, 'Username phải có ít nhất 3 ký tự')
            .max(80, 'Username không được quá 80 ký tự'),
        password: z
            .string()
            .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
            .max(50, 'Mật khẩu không được quá 50 ký tự'),
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

/**
 * Cập nhật hồ sơ hiện tại
 * - email: bắt buộc
 * - fullName: chỉ áp dụng cho sinh viên
 * - phone: chỉ áp dụng cho sinh viên
 */
export const updateProfileSchema: RequestValidationSchema = {
    body: z.object({
        email: z
            .string()
            .trim()
            .min(1, 'Email là bắt buộc')
            .email('Email không hợp lệ'),
        fullName: z
            .string()
            .trim()
            .max(120, 'Họ và tên không được quá 120 ký tự')
            .optional(),
        phone: z
            .string()
            .trim()
            .max(20, 'Số điện thoại không được quá 20 ký tự')
            .optional(),
    }),
}
