import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const certificateIdSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
}

export const certificateCampaignSchema: RequestValidationSchema = {
    params: z.object({
        campaignId: z.string().regex(/^\d+$/),
    }),
}

export const createCertificateTemplateSchema: RequestValidationSchema = {
    body: z.object({
        name: z.string().trim().min(1),
        type: z.string().trim().optional(),
        file_url: z.string().trim().nullable().optional(),
        layout_json: z.record(z.string(), z.unknown()).nullable().optional(),
    }),
}

export const generateCertificatesSchema: RequestValidationSchema = {
    params: z.object({
        campaignId: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        template_id: z.string().regex(/^\d+$/).optional(),
        templateId: z.string().regex(/^\d+$/).optional(),
        module_id: z.string().regex(/^\d+$/).optional(),
        dry_run: z.coerce.boolean().optional(),
        dryRun: z.coerce.boolean().optional(),
    }),
}

export const revokeCertificateSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        reason: z.string().trim().optional(),
        revoke_reason: z.string().trim().optional(),
    }),
}

export const certificateTemplateIdSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
}

export const updateCertificateTemplateSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        name: z.string().trim().min(1).optional(),
        type: z.string().trim().optional(),
        file_url: z.string().trim().nullable().optional(),
        layout_json: z.record(z.string(), z.unknown()).nullable().optional(),
        status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    }),
}
