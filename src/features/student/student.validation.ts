import { RequestValidationSchema } from 'src/types/request'
import * as z from 'zod'

export const updateProfileSchema: RequestValidationSchema = {
    body: z.object({
        phone: z
            .string()
            .regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ')
            .optional(),
        classCode: z
            .string()
            .max(50, 'Tên lớp không được quá 50 ký tự')
            .optional(),
        avatarUrl: z.url('URL ảnh đại diện không hợp lệ').optional(),
        major: z
            .string()
            .max(100, 'Chuyên ngành không được quá 100 ký tự')
            .optional(),
        year: z
            .number()
            .int('Năm học phải là số nguyên')
            .min(1, 'Năm học phải lớn hơn 0')
            .max(10, 'Năm học không hợp lệ')
            .optional(),
    }),
}

export const getMyActivitiesSchema: RequestValidationSchema = {
    query: z.object({
        type: z
            .enum([
                'money_donation',
                'item_pledge',
                'event_registration',
                'certificate',
                '',
            ])
            .optional(),
        status: z.string().trim().optional(),
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
}

export const getMyDonationsSchema: RequestValidationSchema = {
    query: z.object({
        type: z.enum(['money', 'item', '']).optional(),
        status: z.string().trim().optional(),
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
}
