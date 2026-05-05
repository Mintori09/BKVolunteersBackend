import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const createItemDonationSchema: RequestValidationSchema = {
    body: z.object({
        itemPhaseId: z
            .number()
            .int()
            .positive('Item Phase ID phải là số nguyên dương'),
        itemDescription: z
            .string()
            .min(1, 'Mô tả vật phẩm không được để trống')
            .max(1000, 'Mô tả không được quá 1000 ký tự'),
        proofImageUrl: z.string().url('URL ảnh không hợp lệ').optional(),
    }),
}

export const getItemDonationsSchema: RequestValidationSchema = {
    params: z.object({
        phaseId: z.string().min(1, 'Phase ID là bắt buộc'),
    }),
    query: z.object({
        status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(10),
    }),
}

export const verifyItemDonationSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().min(1, 'Donation ID là bắt buộc'),
    }),
    body: z.object({
        points: z.number().int().min(0).optional(),
    }),
}
