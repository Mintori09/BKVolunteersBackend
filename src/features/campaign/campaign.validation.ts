import {
    CampaignPhaseType,
    CampaignTemplateType,
    ParticipantScope,
    VerificationMode,
} from '@prisma/client'
import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

const uuidSchema = z.string().trim().uuid()

const isoDateTimeSchema = z
    .string()
    .trim()
    .datetime({ offset: true })

const optionalNullableText = (max: number) =>
    z
        .string()
        .trim()
        .max(max)
        .nullable()
        .optional()

const draftCampaignBodySchema = z.object({
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().max(10000).optional(),
})

const draftCampaignParamsSchema = z.object({
    id: uuidSchema,
})

const acceptedItemSchema = z.object({
    itemName: z.string().trim().min(1).max(255),
    description: optionalNullableText(5000),
})

const fundraisingConfigSchema = z.object({
    targetAmount: z.number().finite().positive(),
    bankAccountId: uuidSchema.nullable().optional(),
    bankAccountDraft: z
        .object({
            bankName: z.string().trim().min(1).max(255),
            accountNumber: z.string().trim().min(1).max(50),
            ownerName: z.string().trim().min(1).max(255),
            accountName: optionalNullableText(255),
        })
        .nullable()
        .optional(),
    transferNotePrefix: optionalNullableText(100),
    usageDescription: optionalNullableText(10000),
    verificationMode: z.nativeEnum(VerificationMode).optional(),
}).superRefine((value, ctx) => {
    if (!value.bankAccountId && !value.bankAccountDraft) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['bankAccountDraft'],
            message:
                'Either bankAccountId or bankAccountDraft must be provided for fundraisingConfig',
        })
    }
})

const itemDonationConfigSchema = z.object({
    collectionAddress: z.string().trim().min(1).max(255),
    collectionNote: optionalNullableText(10000),
    allowPreRegistration: z.boolean().optional(),
    acceptedItems: z.array(acceptedItemSchema).min(1),
})

const volunteerConfigSchema = z.object({
    maxParticipants: z.number().int().min(1),
    participantScope: z.nativeEnum(ParticipantScope),
    requiresCheckin: z.boolean().optional(),
    taskDescription: optionalNullableText(10000),
})

const organizerCampaignPhaseSchema = z
    .object({
        id: uuidSchema.optional(),
        phaseName: z.string().trim().min(1).max(255),
        phaseType: z.nativeEnum(CampaignPhaseType),
        startAt: isoDateTimeSchema,
        endAt: isoDateTimeSchema,
        registrationStartAt: isoDateTimeSchema.nullable().optional(),
        registrationEndAt: isoDateTimeSchema.nullable().optional(),
        locationText: optionalNullableText(255),
        fundraisingConfig: fundraisingConfigSchema.optional(),
        itemDonationConfig: itemDonationConfigSchema.optional(),
        volunteerConfig: volunteerConfigSchema.optional(),
    })
    .superRefine((value, ctx) => {
        if (new Date(value.startAt) > new Date(value.endAt)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['endAt'],
                message: 'endAt must be equal to or later than startAt',
            })
        }

        if (
            value.registrationStartAt &&
            value.registrationEndAt &&
            new Date(value.registrationStartAt) > new Date(value.registrationEndAt)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['registrationEndAt'],
                message:
                    'registrationEndAt must be equal to or later than registrationStartAt',
            })
        }
    })

const upsertOrganizerCampaignBodySchema = z.object({
    title: z.string().trim().min(1).max(255),
    slogan: optionalNullableText(255),
    description: z.string().trim().min(1).max(10000),
    templateType: z.nativeEnum(CampaignTemplateType),
    publicFrom: isoDateTimeSchema.nullable().optional(),
    publicUntil: isoDateTimeSchema.nullable().optional(),
    phases: z.array(organizerCampaignPhaseSchema).min(1),
})

const organizerCampaignParamsSchema = z.object({
    id: uuidSchema,
})

const organizerCampaignDocumentParamsSchema = z.object({
    id: uuidSchema,
    documentId: uuidSchema,
})

const campaignLifecycleBodySchema = z.object({
    action: z.enum(['pause', 'resume', 'end']),
})

const organizerCampaignCertificateTemplateParamsSchema = z.object({
    id: uuidSchema,
    phaseId: uuidSchema,
})

const campaignCertificateLayoutBodySchema = z.object({
    phaseId: uuidSchema,
    namePosXPercent: z.number().min(0).max(100),
    namePosYPercent: z.number().min(0).max(100),
    fontSize: z.number().int().min(12).max(120),
    fontColorHex: z
        .string()
        .trim()
        .regex(/^#[0-9a-fA-F]{6}$/, 'fontColorHex must be a valid hex color'),
})

const sendCampaignCertificateEmailsBodySchema = z.object({
    phaseId: uuidSchema,
    registrationIds: z.array(uuidSchema).min(1).max(1000).optional(),
    senderName: z.string().trim().max(255).nullable().optional(),
    senderEmail: z.string().trim().email().max(255).nullable().optional(),
    subject: z.string().trim().min(1).max(255),
    htmlContentBase64: z.string().trim().min(1).max(500000),
})

const upsertGeneratedCampaignCertificatesBodySchema = z.object({
    phaseId: uuidSchema,
    items: z
        .array(
            z.object({
                registrationId: uuidSchema,
                fileId: uuidSchema,
            })
        )
        .min(1)
        .max(1000),
})

const exportOrganizerCampaignBodySchema = z.object({
    phaseId: uuidSchema,
    unitName: z.string().trim().min(1).max(255),
    signerName: z.string().trim().min(1).max(255),
    preparedByName: z.string().trim().min(1).max(255),
})

export const createDraftCampaignSchema: RequestValidationSchema = {
    body: draftCampaignBodySchema,
}

export const updateDraftCampaignSchema: RequestValidationSchema = {
    body: draftCampaignBodySchema,
    params: draftCampaignParamsSchema,
}

export const createOrganizerCampaignSchema: RequestValidationSchema = {
    body: upsertOrganizerCampaignBodySchema,
}

export const updateOrganizerCampaignSchema: RequestValidationSchema = {
    body: upsertOrganizerCampaignBodySchema,
    params: organizerCampaignParamsSchema,
}

export const organizerCampaignParamsValidationSchema: RequestValidationSchema = {
    params: organizerCampaignParamsSchema,
}

export const organizerCampaignDocumentParamsValidationSchema: RequestValidationSchema =
    {
        params: organizerCampaignDocumentParamsSchema,
    }

export const campaignLifecycleSchema: RequestValidationSchema = {
    body: campaignLifecycleBodySchema,
    params: organizerCampaignParamsSchema,
}

export const organizerCampaignCertificateTemplateParamsValidationSchema: RequestValidationSchema =
    {
        params: organizerCampaignCertificateTemplateParamsSchema,
    }

export const campaignCertificateLayoutSchema: RequestValidationSchema = {
    body: campaignCertificateLayoutBodySchema,
    params: organizerCampaignParamsSchema,
}

export const sendCampaignCertificateEmailsSchema: RequestValidationSchema = {
    body: sendCampaignCertificateEmailsBodySchema,
    params: organizerCampaignParamsSchema,
}

export const upsertGeneratedCampaignCertificatesSchema: RequestValidationSchema =
    {
        body: upsertGeneratedCampaignCertificatesBodySchema,
        params: organizerCampaignParamsSchema,
    }

export const exportOrganizerCampaignSchema: RequestValidationSchema = {
    body: exportOrganizerCampaignBodySchema,
    params: organizerCampaignParamsSchema,
}
