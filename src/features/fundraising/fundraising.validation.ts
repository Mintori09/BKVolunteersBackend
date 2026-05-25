import * as z from 'zod'
import { RequestValidationSchema } from 'src/types/request'

export const fundraisingModuleSchema: RequestValidationSchema = {
    params: z.object({
        moduleId: z.string().regex(/^\d+$/),
    }),
}

export const fundraisingTransactionSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
}

export const fundraisingModuleConfigSchema: RequestValidationSchema = {
    params: z.object({
        moduleId: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        settings_json: z.record(z.string(), z.unknown()).nullable().optional(),
        target_amount: z.coerce.number().positive().optional(),
        receiver_name: z.string().trim().min(1).optional(),
        bank_name: z.string().trim().min(1).optional(),
        bank_account_no: z.string().trim().min(1).optional(),
        currency: z.string().trim().min(1).optional(),
        sepay_enabled: z.boolean().optional(),
        sepay_account_id: z.string().trim().nullable().optional(),
        status: z.string().trim().optional(),
    }),
}

export const createFundraisingDonationSchema: RequestValidationSchema = {
    params: z.object({
        moduleId: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        amount: z.coerce.number().positive(),
        donor_name: z.string().trim().optional(),
        message: z.string().trim().optional(),
        evidence_url: z.string().trim().optional(),
    }),
}

export const listFundraisingDonationsSchema: RequestValidationSchema = {
    params: z.object({
        moduleId: z.string().regex(/^\d+$/),
    }),
    query: z.object({
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
        status: z
            .enum(['PENDING', 'MATCHED', 'VERIFIED', 'REJECTED', 'REFUNDED'])
            .optional(),
        q: z.string().trim().optional(),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
    }),
}

export const fundraisingDecisionSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        reason: z.string().trim().optional(),
        reject_reason: z.string().trim().optional(),
        note: z.string().trim().optional(),
        transaction_id: z.string().regex(/^\d+$/).optional(),
    }),
}

export const attachFundraisingTransactionSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        donation_id: z.string().regex(/^\d+$/),
    }),
}

export const listFundraisingTransactionsSchema: RequestValidationSchema = {
    query: z.object({
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
        match_status: z.enum(['MATCHED', 'UNMATCHED']).optional(),
        q: z.string().trim().optional(),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        module_id: z.string().regex(/^\d+$/).optional(),
        campaign_id: z.string().regex(/^\d+$/).optional(),
    }),
}

export const sepayWebhookSchema: RequestValidationSchema = {
    body: z
        .object({
            transaction_id: z.string().optional(),
            id: z.string().optional(),
            gateway_transaction_id: z.string().optional(),
            amount: z.coerce.number().optional(),
            content: z.string().optional(),
            account_number: z.string().optional(),
            transaction_time: z.string().optional(),
            created_at: z.string().optional(),
            module_id: z.string().regex(/^\d+$/).optional(),
            campaign_id: z.string().regex(/^\d+$/).optional(),
        })
        .passthrough(),
}
