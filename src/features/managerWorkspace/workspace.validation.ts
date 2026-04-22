import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

const entityParamsSchema = z.object({
    id: z.string().trim().uuid(),
})

export const updateMembershipStatusSchema: RequestValidationSchema = {
    params: entityParamsSchema,
    body: z.object({
        status: z.enum(['APPROVED', 'REJECTED', 'REMOVED']),
    }),
}

export const reviewRegistrationSchema: RequestValidationSchema = {
    params: entityParamsSchema,
    body: z.object({
        status: z.enum(['APPROVED', 'REJECTED', 'WAITLISTED']),
        note: z.string().trim().max(2000).optional(),
    }),
}

export const reviewContributionSchema: RequestValidationSchema = {
    params: entityParamsSchema,
    body: z.object({
        status: z.enum(['VERIFIED', 'REJECTED']),
        note: z.string().trim().max(2000).optional(),
    }),
}

export const workspaceEntityParamsSchema: RequestValidationSchema = {
    params: entityParamsSchema,
}

export const exportWorkspaceReportSchema: RequestValidationSchema = {
    body: z.object({
        type: z.enum(['volunteers', 'contributions', 'campaigns']),
    }),
}
