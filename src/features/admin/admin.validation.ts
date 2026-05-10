import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const listAuditLogsSchema: RequestValidationSchema = {
    query: z.object({
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
        action: z.string().trim().min(1).optional(),
        entity_type: z.string().trim().min(1).optional(),
        entity_id: z.string().regex(/^\d+$/).optional(),
        actor_type: z.string().trim().min(1).optional(),
        actor_id: z.string().regex(/^\d+$/).optional(),
    }),
}

export const listBackgroundJobsSchema: RequestValidationSchema = {
    query: z.object({
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
        type: z.string().trim().min(1).optional(),
        status: z.string().trim().min(1).optional(),
    }),
}
