import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const eventModuleParamsSchema: RequestValidationSchema = {
    params: z.object({
        moduleId: z.string().regex(/^\d+$/),
    }),
}

export const eventRegisterSchema: RequestValidationSchema = {
    params: z.object({
        moduleId: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        answers_json: z.record(z.string(), z.unknown()).nullable().optional(),
    }),
}

export const eventApproveSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        note: z.string().trim().optional(),
    }),
}

export const eventRejectSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        reason: z.string().trim().min(1, 'Cần nhập lý do từ chối'),
    }),
}

export const eventCheckInSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        checked_in_at: z.string().optional(),
    }),
}

export const eventCompleteSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        checked_out_at: z.string().optional(),
        hours: z.number().positive().optional(),
        note: z.string().trim().optional(),
    }),
}

export const eventListRegistrationsSchema: RequestValidationSchema = {
    params: z.object({
        moduleId: z.string().regex(/^\d+$/),
    }),
    query: z.object({
        status: z.string().trim().optional(),
        q: z.string().trim().optional(),
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
}
