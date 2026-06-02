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
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
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

export const runBackgroundJobsSchema: RequestValidationSchema = {
    body: z.object({
        type: z.string().trim().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(50).optional(),
    }),
}

export const retryBackgroundJobSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
}

export const listAdminOrganizationsSchema: RequestValidationSchema = {
    query: z.object({
        q: z.string().trim().min(1).optional(),
        type: z.string().trim().min(1).optional(),
        status: z.string().trim().min(1).optional(),
    }),
}

export const createAdminOrganizationSchema: RequestValidationSchema = {
    body: z.object({
        code: z.string().trim().min(1).max(50),
        name: z.string().trim().min(1).max(255),
        type: z.string().trim().min(1).max(40),
        status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
        faculty_id: z.string().regex(/^\d+$/).optional(),
        logo_url: z.string().trim().max(500).nullable().optional(),
        description: z.string().nullable().optional(),
    }),
}

export const updateAdminOrganizationSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        code: z.string().trim().min(1).max(50).optional(),
        name: z.string().trim().min(1).max(255).optional(),
        type: z.string().trim().min(1).max(40).optional(),
        status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
        faculty_id: z.string().regex(/^\d+$/).nullable().optional(),
        logo_url: z.string().trim().max(500).nullable().optional(),
        description: z.string().nullable().optional(),
    }),
}

export const deleteAdminOrganizationSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
}
