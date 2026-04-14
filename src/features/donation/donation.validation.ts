import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const createDonationSchema: RequestValidationSchema = {
    body: z.object({
        moneyPhaseId: z.number().int().positive('Money Phase ID phải là số nguyên dương'),
        amount: z.number().positive('Số tiền phải lớn hơn 0'),
        proofImageUrl: z.string().url('URL ảnh minh chứng không hợp lệ'),
    }),
}

export const donationIdSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().min(1, 'ID không hợp lệ'),
    }),
}

export const rejectDonationSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().min(1, 'ID không hợp lệ'),
    }),
    body: z.object({
        reason: z
            .string()
            .min(1, 'Lý do từ chối là bắt buộc')
            .max(500, 'Lý do không được quá 500 ký tự'),
    }),
}

export const verifyDonationSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().min(1, 'ID không hợp lệ'),
    }),
    body: z.object({
        verifiedAmount: z.number().positive('Số tiền xác thực phải lớn hơn 0'),
    }),
}

export const myDonationsSchema: RequestValidationSchema = {
    query: z.object({
        status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
        page: z.string().regex(/^\d+$/, 'Page phải là số').optional(),
        limit: z.string().regex(/^\d+$/, 'Limit phải là số').optional(),
    }),
}