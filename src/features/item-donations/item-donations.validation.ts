import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const itemDonationModuleSchema: RequestValidationSchema = {
    params: z.object({
        moduleId: z.string().regex(/^\d+$/),
    }),
}

export const createItemPledgeSchema: RequestValidationSchema = {
    params: z.object({
        moduleId: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        item_target_id: z.string().regex(/^\d+$/),
        quantity: z.coerce.number().int().positive(),
        donor_name: z.string().trim().min(1).optional(),
        expected_handover_at: z.string().datetime().optional(),
        note: z.string().trim().optional(),
    }),
}

export const confirmItemPledgeSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
}

export const updateItemDonationConfigSchema: RequestValidationSchema = {
    params: z.object({
        moduleId: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        receiver_address: z.string().trim().min(1),
        receiver_contact: z.string().trim().min(1),
        allow_over_target: z.boolean(),
        handover_note: z.string().trim().max(500).nullable().optional(),
    }),
}

export const createItemTargetSchema: RequestValidationSchema = {
    params: z.object({
        moduleId: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        name: z.string().trim().min(1).max(255),
        unit: z.string().trim().min(1).max(50),
        target_quantity: z.coerce.number().int().positive(),
        description: z.string().trim().max(2000).optional(),
    }),
}

export const itemTargetParamsSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
}

export const updateItemTargetSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        name: z.string().trim().min(1).max(255),
        unit: z.string().trim().min(1).max(50),
        target_quantity: z.coerce.number().int().positive(),
        description: z.string().trim().max(2000).optional(),
        status: z.enum(['ACTIVE', 'CLOSED']),
    }),
}

export const getItemTargetsSchema: RequestValidationSchema = {
    params: z.object({
        moduleId: z.string().regex(/^\d+$/),
    }),
    query: z.object({
        status: z.enum(['ACTIVE', 'CLOSED']).optional(),
    }),
}

export const getItemPledgesSchema: RequestValidationSchema = {
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

export const rejectItemPledgeSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        reason: z.string().trim().min(1).max(500),
    }),
}

export const handoverItemPledgeSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        received_quantity: z.coerce.number().int().positive(),
        received_at: z.string().datetime().optional(),
        location: z.string().trim().max(255).optional(),
        note: z.string().trim().max(500).optional(),
        evidence_url: z.string().url().optional(),
    }),
}
