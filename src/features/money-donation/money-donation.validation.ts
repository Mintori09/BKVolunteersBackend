import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const createMoneyPhaseSchema: RequestValidationSchema = {
    params: z.object({
        campaignId: z.string().min(1, 'Campaign ID không hợp lệ'),
    }),
    body: z
        .object({
            targetAmount: z.number().positive('Số tiền mục tiêu phải lớn hơn 0'),
            bankAccountNo: z
                .string()
                .min(1, 'Số tài khoản không được để trống')
                .max(20, 'Số tài khoản không được quá 20 ký tự'),
            bankAccountName: z
                .string()
                .min(1, 'Tên chủ tài khoản không được để trống')
                .max(100, 'Tên chủ tài khoản không được quá 100 ký tự'),
            bankCode: z
                .string()
                .min(1, 'Mã ngân hàng không được để trống')
                .max(10, 'Mã ngân hàng không được quá 10 ký tự'),
            startDate: z.coerce.date().optional(),
            endDate: z.coerce.date().optional(),
        })
        .refine(
            (data) => {
                if (data.startDate && data.endDate) {
                    return data.startDate < data.endDate
                }
                return true
            },
            {
                message: 'Ngày kết thúc phải sau ngày bắt đầu',
            }
        ),
}

export const updateMoneyPhaseSchema: RequestValidationSchema = {
    params: z.object({
        campaignId: z.string().min(1, 'Campaign ID không hợp lệ'),
        phaseId: z.string().regex(/^\d+$/, 'Phase ID phải là số'),
    }),
    body: z
        .object({
            targetAmount: z.number().positive('Số tiền mục tiêu phải lớn hơn 0').optional(),
            bankAccountNo: z
                .string()
                .min(1, 'Số tài khoản không được để trống')
                .max(20, 'Số tài khoản không được quá 20 ký tự')
                .optional(),
            bankAccountName: z
                .string()
                .min(1, 'Tên chủ tài khoản không được để trống')
                .max(100, 'Tên chủ tài khoản không được quá 100 ký tự')
                .optional(),
            bankCode: z
                .string()
                .min(1, 'Mã ngân hàng không được để trống')
                .max(10, 'Mã ngân hàng không được quá 10 ký tự')
                .optional(),
            startDate: z.coerce.date().optional(),
            endDate: z.coerce.date().optional(),
        })
        .refine(
            (data) => {
                if (data.startDate && data.endDate) {
                    return data.startDate < data.endDate
                }
                return true
            },
            {
                message: 'Ngày kết thúc phải sau ngày bắt đầu',
            }
        ),
}

export const moneyPhaseParamsSchema: RequestValidationSchema = {
    params: z.object({
        campaignId: z.string().min(1, 'Campaign ID không hợp lệ'),
        phaseId: z.string().regex(/^\d+$/, 'Phase ID phải là số'),
    }),
}

export const phaseIdSchema: RequestValidationSchema = {
    params: z.object({
        phaseId: z.string().regex(/^\d+$/, 'Phase ID phải là số'),
    }),
}

export const donationsQuerySchema: RequestValidationSchema = {
    params: z.object({
        phaseId: z.string().regex(/^\d+$/, 'Phase ID phải là số'),
    }),
    query: z.object({
        status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
        page: z.string().regex(/^\d+$/, 'Page phải là số').optional(),
        limit: z.string().regex(/^\d+$/, 'Limit phải là số').optional(),
    }),
}
