import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const listPublicCampaignsSchema: RequestValidationSchema = {
    query: z.object({
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
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
