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

const idParam = z.object({
    id: z.string().regex(/^\d+$/, 'ID không hợp lệ'),
})

export const approvalIdSchema: RequestValidationSchema = {
    params: idParam,
}

export const approvalActionSchema: RequestValidationSchema = {
    params: idParam,
    body: z.object({
        reason: z.string().max(1000).optional(),
    }),
}

export const approvalCommentSchema: RequestValidationSchema = {
    params: idParam,
    body: z.object({
        body: z.string().min(1).max(5000),
        visibility: z.enum(['INTERNAL', 'PUBLIC']).optional(),
        module_id: z.string().regex(/^\d+$/).optional(),
    }),
}
