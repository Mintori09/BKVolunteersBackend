import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const createItemPhaseSchema: RequestValidationSchema = {
    body: z.object({
        acceptedItems: z
            .array(z.string().min(1, 'Vật phẩm không được để trống'))
            .min(1, 'Phải có ít nhất 1 vật phẩm chấp nhận'),
        collectionAddress: z.string().optional(),
        startDate: z
            .string()
            .transform((val) => new Date(val))
            .optional(),
        endDate: z
            .string()
            .transform((val) => new Date(val))
            .optional(),
    }),
    params: z.object({
        campaignId: z.string().min(1, 'Campaign ID là bắt buộc'),
    }),
}

export const updateItemPhaseSchema: RequestValidationSchema = {
    body: z.object({
        acceptedItems: z
            .array(z.string().min(1, 'Vật phẩm không được để trống'))
            .optional(),
        collectionAddress: z.string().optional(),
        startDate: z
            .string()
            .transform((val) => new Date(val))
            .optional(),
        endDate: z
            .string()
            .transform((val) => new Date(val))
            .optional(),
    }),
    params: z.object({
        campaignId: z.string().min(1, 'Campaign ID là bắt buộc'),
        phaseId: z.string().min(1, 'Phase ID là bắt buộc'),
    }),
}

export const deleteItemPhaseSchema: RequestValidationSchema = {
    params: z.object({
        campaignId: z.string().min(1, 'Campaign ID là bắt buộc'),
        phaseId: z.string().min(1, 'Phase ID là bắt buộc'),
    }),
}
