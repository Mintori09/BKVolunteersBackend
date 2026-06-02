import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const listPublicCampaignsSchema: RequestValidationSchema = {
    query: z.object({
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
        q: z.string().trim().optional(),
        organization_id: z.string().regex(/^\d+$/).optional(),
        module_type: z.enum(['fundraising', 'item_donation', 'event']).optional(),
        status: z.enum(['PUBLISHED', 'ONGOING']).optional(),
    }),
}

export const publicCampaignSlugSchema: RequestValidationSchema = {
    params: z.object({
        slug: z.string().min(1),
    }),
}

export const publicCertificateVerifySchema: RequestValidationSchema = {
    params: z.object({
        certificateNo: z.string().min(1),
    }),
}
