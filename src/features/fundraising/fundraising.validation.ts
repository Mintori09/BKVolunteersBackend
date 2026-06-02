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
        sepay_bank_account_id: z.string().trim().nullable().optional(),
        sepay_mode: z.enum(['TRANSFER_CODE', 'ORDER_VA']).optional(),
        sepay_va_prefix: z.string().trim().nullable().optional(),
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
            id: z.union([z.string(), z.number()]).optional(),
            gateway_transaction_id: z.string().optional(),
            amount: z.coerce.number().optional(),
            transferAmount: z.coerce.number().optional(),
            content: z.string().optional(),
            description: z.string().optional(),
            account_number: z.string().optional(),
            accountNumber: z.string().optional(),
            transaction_time: z.string().optional(),
            created_at: z.string().optional(),
            transactionDate: z.string().optional(),
            referenceCode: z.string().optional(),
            code: z.string().optional(),
            va: z.string().optional(),
            bank_account_id: z.string().optional(),
            va_id: z.string().optional(),
            webhook_success: z.union([z.number(), z.boolean()]).optional(),
            module_id: z.string().regex(/^\d+$/).optional(),
            campaign_id: z.string().regex(/^\d+$/).optional(),
        })
        .passthrough(),
}

export const fundraisingDonationSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
}

export const sepayAccountListSchema: RequestValidationSchema = {
    query: z.object({
        q: z.string().trim().optional(),
        bank_short_name: z.string().trim().optional(),
        active: z.enum(['0', '1']).optional(),
        page: z.coerce.number().int().min(1).optional(),
        per_page: z.coerce.number().int().min(1).max(100).optional(),
    }),
}

export const sepaySyncTransactionsSchema: RequestValidationSchema = {
    body: z.object({
        sepay_bank_account_id: z.string().trim().optional(),
        transaction_date_from: z.string().optional(),
        transaction_date_to: z.string().optional(),
        since_id: z.string().trim().optional(),
        q: z.string().trim().optional(),
        per_page: z.coerce.number().int().min(1).max(100).optional(),
    }),
}

export const sepaySyncVirtualAccountsSchema: RequestValidationSchema = {
    body: z.object({
        sepay_bank_account_id: z.string().trim().optional(),
        q: z.string().trim().optional(),
        active: z.enum(['0', '1']).optional(),
        official: z.enum(['0', '1']).optional(),
        static: z.enum(['0', '1']).optional(),
        per_page: z.coerce.number().int().min(1).max(100).optional(),
    }),
}

export const sepayCreateOrderVaSchema: RequestValidationSchema = {
    body: z.object({
        donation_id: z
            .union([z.string(), z.number(), z.bigint()])
            .transform((value) => {
                if (typeof value === 'string') {
                    const trimmed = value.trim()
                    return trimmed.startsWith('#')
                        ? trimmed.slice(1).trim()
                        : trimmed
                }
                return String(value)
            })
            .pipe(z.string().regex(/^\d+$/)),
    }),
}

export const sepayOperationRequestSchema: RequestValidationSchema = {
    body: z.object({
        request_type: z.enum([
            'SYNC_ACCOUNTS',
            'SYNC_TRANSACTIONS',
            'SYNC_VIRTUAL_ACCOUNTS',
            'CREATE_ORDER_VA',
            'MAP_ACCOUNT',
        ]),
        sepay_bank_account_id: z.string().trim().optional(),
        campaign_id: z.string().regex(/^\d+$/).optional(),
        module_id: z.string().regex(/^\d+$/).optional(),
        donation_id: z
            .union([z.string(), z.number(), z.bigint()])
            .transform((value) => {
                if (typeof value === 'string') {
                    const trimmed = value.trim()
                    return trimmed.startsWith('#')
                        ? trimmed.slice(1).trim()
                        : trimmed
                }
                return String(value)
            })
            .pipe(z.string().regex(/^\d+$/))
            .optional(),
        note: z.string().trim().max(2000).optional(),
    }),
}

export const sepayOperationRequestListSchema: RequestValidationSchema = {
    query: z.object({
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    }),
}

export const sepayOperationRequestDecisionSchema: RequestValidationSchema = {
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        decision_note: z.string().trim().max(2000).optional(),
    }),
}
