import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'
import { mediaUseCases } from 'src/services/media/media.constants'

const businessIdSchema = z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[A-Za-z0-9_-]+$/, 'Only A-Z, a-z, 0-9, - and _ are allowed')

const booleanLikeSchema = z.union([
    z.boolean(),
    z.enum(['true', 'false']),
])

const singularReferenceUseCases = new Set([
    'student-avatar',
    'campaign-cover',
    'campaign-logo',
    'fundraising-qr',
    'contribution-proof',
    'certificate-template',
])

const campaignFileUseCases = new Set([
    'campaign-plan',
    'campaign-budget',
    'campaign-report',
    'campaign-gallery',
])

const baseMediaBodySchema = z
    .object({
        useCase: z.enum(mediaUseCases),
        referenceId: businessIdSchema.optional(),
        campaignId: businessIdSchema.optional(),
        phaseId: businessIdSchema.optional(),
        isPublic: booleanLikeSchema.optional(),
        uploadedByStudentId: businessIdSchema.optional(),
        uploadedByManagerId: businessIdSchema.optional(),
    })
    .superRefine((data, ctx) => {
        if (data.uploadedByStudentId && data.uploadedByManagerId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['uploadedByStudentId'],
                message:
                    'Only one uploader is allowed: student or manager',
            })
        }

        if (
            singularReferenceUseCases.has(data.useCase) &&
            !data.referenceId
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['referenceId'],
                message: `referenceId is required for ${data.useCase}`,
            })
        }

        if (campaignFileUseCases.has(data.useCase) && !data.campaignId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['campaignId'],
                message: `campaignId is required for ${data.useCase}`,
            })
        }
    })

export const uploadMediaSchema: RequestValidationSchema = {
    body: baseMediaBodySchema,
}

export const replaceMediaSchema: RequestValidationSchema = {
    params: z.object({
        id: businessIdSchema,
    }),
    body: baseMediaBodySchema,
}

export const deleteMediaSchema: RequestValidationSchema = {
    params: z.object({
        id: businessIdSchema,
    }),
    body: z.object({
        invalidate: booleanLikeSchema.optional(),
    }),
}
