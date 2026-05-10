import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const approvalQueueSchema: RequestValidationSchema = {
    query: z.object({
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
        status: z.string().trim().min(1).optional(),
        organization_id: z.string().regex(/^\d+$/).optional(),
        faculty_id: z.string().regex(/^\d+$/).optional(),
    }),
}
