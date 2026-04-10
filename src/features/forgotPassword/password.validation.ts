import { RequestValidationSchema } from 'src/types/request'
import * as z from 'zod'

// ============================================
// FORGOT PASSWORD VALIDATION SCHEMAS
// ============================================

/**
 * Yêu cầu quên mật khẩu
 * - email: email đã đăng ký (định dạng email hợp lệ)
 */
export const forgotPasswordSchema: RequestValidationSchema = {
    body: z.object({
        email: z.string().email('Email không hợp lệ'),
    }),
}

/**
 * Đặt lại mật khẩu
 * - token: JWT token từ email (định dạng JWT)
 * - newPassword: mật khẩu mới (6-150 ký tự)
 */
export const resetPasswordSchema: RequestValidationSchema = {
    body: z.object({
        newPassword: z
            .string()
            .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự')
            .max(150, 'Mật khẩu mới không được quá 150 ký tự'),
    }),
    params: z.object({
        token: z
            .string()
            .regex(
                /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/,
                'Token không hợp lệ'
            ),
    }),
}
