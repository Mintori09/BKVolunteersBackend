import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'
import { CAMPAIGN_STATUS_VALUES, CAMPAIGN_SCOPE_VALUES } from './types'

export const createCampaignSchema: RequestValidationSchema = {
    body: z.object({
        title: z
            .string()
            .min(1, 'Tiêu đề không được để trống')
            .max(255, 'Tiêu đề không được quá 255 ký tự'),
        description: z.string().optional(),
        scope: z.enum(CAMPAIGN_SCOPE_VALUES, {
            message: 'Phạm vi không hợp lệ',
        }),
    }),
}

export const updateCampaignSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().min(1, 'ID không hợp lệ'),
    }),
    body: z.object({
        title: z
            .string()
            .min(1, 'Tiêu đề không được để trống')
            .max(255, 'Tiêu đề không được quá 255 ký tự')
            .optional(),
        description: z.string().optional(),
    }),
}

export const campaignIdSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().min(1, 'ID không hợp lệ'),
    }),
}

export const approveCampaignSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().min(1, 'ID không hợp lệ'),
    }),
    body: z.object({
        comment: z
            .string()
            .max(1000, 'Ghi chú không được quá 1000 ký tự')
            .optional(),
    }),
}

export const rejectCampaignSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().min(1, 'ID không hợp lệ'),
    }),
    body: z.object({
        comment: z
            .string()
            .min(1, 'Lý do từ chối là bắt buộc')
            .max(1000, 'Lý do không được quá 1000 ký tự'),
    }),
}

export const completeCampaignSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().min(1, 'ID không hợp lệ'),
    }),
    body: z.object({
        eventPhotos: z.array(z.string().url()).optional(),
    }),
}

export const uploadPlanFileSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().min(1, 'ID không hợp lệ'),
    }),
    body: z.object({
        planFileUrl: z.string().url('URL file không hợp lệ'),
    }),
}

export const uploadBudgetFileSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().min(1, 'ID không hợp lệ'),
    }),
    body: z.object({
        budgetFileUrl: z.string().url('URL file không hợp lệ'),
    }),
}

export const getCampaignsSchema: RequestValidationSchema = {
    query: z.object({
        status: z.enum(CAMPAIGN_STATUS_VALUES).optional(),
        scope: z.enum(CAMPAIGN_SCOPE_VALUES).optional(),
        facultyId: z.coerce.number().int().positive().optional(),
        creatorId: z.string().optional(),
        page: z
            .string()
            .regex(/^\d+$/, 'Page phải là số nguyên dương')
            .optional(),
        limit: z
            .string()
            .regex(/^\d+$/, 'Limit phải là số nguyên dương')
            .optional(),
    }),
}

export const getAvailableCampaignsSchema: RequestValidationSchema = {
    query: z.object({
        page: z
            .string()
            .regex(/^\d+$/, 'Page phải là số nguyên dương')
            .optional(),
        limit: z
            .string()
            .regex(/^\d+$/, 'Limit phải là số nguyên dương')
            .optional(),
    }),
}
