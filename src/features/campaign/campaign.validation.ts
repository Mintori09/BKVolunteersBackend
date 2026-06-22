import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'
import {
    CAMPAIGN_MODULE_TYPE_VALUES,
    CAMPAIGN_SCOPE_TYPE_VALUES,
    CAMPAIGN_STATUS_VALUES,
} from './types'

const idParam = z.object({
    id: z.string().regex(/^\d+$/, 'ID không hợp lệ'),
})

const moduleIdParam = z.object({
    id: z.string().regex(/^\d+$/, 'ID không hợp lệ'),
    moduleId: z.string().regex(/^\d+$/, 'Module ID không hợp lệ'),
})

const isoDatetime = z.string().datetime({
    message: 'Thời gian phải là ISO datetime hợp lệ',
})

export const createCampaignSchema: RequestValidationSchema = {
    body: z.object({
        title: z.string().min(1).max(255),
        slug: z.string().min(3).max(255),
        summary: z.string().min(1).max(500),
        description: z.string().nullable().optional(),
        cover_image_url: z.string().url().nullable().optional(),
        beneficiary: z.string().max(255).nullable().optional(),
        scope_type: z.enum(CAMPAIGN_SCOPE_TYPE_VALUES),
        organization_id: z.number().int().positive().optional(),
        faculty_id: z.number().int().positive().nullable().optional(),
        start_at: isoDatetime,
        end_at: isoDatetime,
    }),
}

export const updateCampaignSchema: RequestValidationSchema = {
    params: idParam,
    body: z.object({
        title: z.string().min(1).max(255).optional(),
        slug: z.string().min(3).max(255).optional(),
        summary: z.string().min(1).max(500).optional(),
        description: z.string().nullable().optional(),
        cover_image_url: z.string().url().nullable().optional(),
        beneficiary: z.string().max(255).nullable().optional(),
        scope_type: z.enum(CAMPAIGN_SCOPE_TYPE_VALUES).optional(),
        faculty_id: z.number().int().positive().nullable().optional(),
        start_at: isoDatetime.optional(),
        end_at: isoDatetime.optional(),
    }),
}

export const campaignIdSchema: RequestValidationSchema = {
    params: idParam,
}

export const reviewCampaignSchema: RequestValidationSchema = {
    params: idParam,
    body: z.object({
        comment: z.string().min(1).max(1000),
    }),
}

export const approveCampaignSchema: RequestValidationSchema = {
    params: idParam,
    body: z.object({
        comment: z.string().max(1000).optional(),
    }),
}

export const endCampaignSchema: RequestValidationSchema = {
    params: idParam,
}

export const getCampaignsSchema: RequestValidationSchema = {
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        status: z.enum(CAMPAIGN_STATUS_VALUES).optional(),
        scope_type: z.enum(CAMPAIGN_SCOPE_TYPE_VALUES).optional(),
        organization_id: z.string().regex(/^\d+$/).optional(),
        faculty_id: z.string().regex(/^\d+$/).optional(),
    }),
}

export const createCampaignModuleSchema: RequestValidationSchema = {
    params: idParam,
    body: z.object({
        type: z.enum(CAMPAIGN_MODULE_TYPE_VALUES),
        title: z.string().min(1).max(255),
        description: z.string().nullable().optional(),
        start_at: isoDatetime,
        end_at: isoDatetime,
        status: z.string().max(40).optional(),
        settings_json: z.record(z.string(), z.unknown()).optional(),
    }),
}

export const updateCampaignModuleSchema: RequestValidationSchema = {
    params: moduleIdParam,
    body: z.object({
        title: z.string().min(1).max(255).optional(),
        description: z.string().nullable().optional(),
        start_at: isoDatetime.optional(),
        end_at: isoDatetime.optional(),
        status: z.string().max(40).optional(),
        settings_json: z.record(z.string(), z.unknown()).optional(),
    }),
}
