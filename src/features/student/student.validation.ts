import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const updateProfileSchema: RequestValidationSchema = {
    body: z.object({
        phone: z
            .string()
            .regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ')
            .optional(),
        className: z
            .string()
            .max(50, 'Tên lớp không được quá 50 ký tự')
            .optional(),
    }),
}

export const pointsHistorySchema: RequestValidationSchema = {
    query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(10),
        sourceType: z
            .enum([
                'EVENT_PARTICIPATION',
                'MONEY_DONATION',
                'ITEM_DONATION',
                'MANUAL_ADJUSTMENT',
                'BONUS',
            ])
            .optional(),
        fromDate: z.coerce.date().optional(),
        toDate: z.coerce.date().optional(),
    }),
}
