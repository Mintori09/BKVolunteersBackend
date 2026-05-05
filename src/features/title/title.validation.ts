import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const createTitleSchema: RequestValidationSchema = {
    body: z.object({
        name: z
            .string()
            .min(1, 'Tên danh hiệu không được để trống')
            .max(100, 'Tên danh hiệu không được quá 100 ký tự'),
        description: z.string().max(1000).optional(),
        minPoints: z.number().int().min(0, 'Điểm tối thiểu phải >= 0'),
        iconUrl: z.string().url('URL không hợp lệ').optional(),
        badgeColor: z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/, 'Màu phải ở định dạng #RRGGBB')
            .optional(),
    }),
}

export const updateTitleSchema: RequestValidationSchema = {
    body: z.object({
        name: z
            .string()
            .min(1, 'Tên danh hiệu không được để trống')
            .max(100, 'Tên danh hiệu không được quá 100 ký tự')
            .optional(),
        description: z.string().max(1000).optional(),
        minPoints: z
            .number()
            .int()
            .min(0, 'Điểm tối thiểu phải >= 0')
            .optional(),
        iconUrl: z.string().url('URL không hợp lệ').optional(),
        badgeColor: z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/, 'Màu phải ở định dạng #RRGGBB')
            .optional(),
        isActive: z.boolean().optional(),
    }),
    params: z.object({
        id: z.coerce.number().int().positive(),
    }),
}

export const getTitlesSchema: RequestValidationSchema = {
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(10),
        isActive: z.coerce.boolean().optional(),
    }),
}

export const titleIdSchema: RequestValidationSchema = {
    params: z.object({
        id: z.coerce.number().int().positive(),
    }),
}
