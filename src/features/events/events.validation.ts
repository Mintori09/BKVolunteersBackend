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
