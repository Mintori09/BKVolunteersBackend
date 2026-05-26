export interface FundraisingModuleParams {
    moduleId: string
}

export interface FundraisingDonationParams {
    id: string
}

export interface FundraisingTransactionParams {
    id: string
}

export interface FundraisingDonationListQuery {
    page?: number
    limit?: number
    status?: string
    q?: string
    from?: string
    to?: string
}

export interface FundraisingTransactionListQuery {
    page?: number
    limit?: number
    match_status?: 'MATCHED' | 'UNMATCHED'
    q?: string
    from?: string
    to?: string
    module_id?: string
    campaign_id?: string
}

export interface FundraisingModuleConfigBody {
    settings_json?: Record<string, unknown> | null
    target_amount?: number
    receiver_name?: string
    bank_name?: string
    bank_account_no?: string
    currency?: string
    sepay_enabled?: boolean
    sepay_account_id?: string | null
    status?: string
}

export interface CreateFundraisingDonationBody {
    amount: number
    donor_name?: string
    message?: string
    evidence_url?: string
}

export interface FundraisingDecisionBody {
    reason?: string
    reject_reason?: string
    note?: string
    transaction_id?: string
}

export interface AttachFundraisingTransactionBody {
    donation_id: string
}

export interface SepayWebhookBody {
    transaction_id?: string
    id?: string | number
    gateway_transaction_id?: string
    amount?: number
    transferAmount?: number
    content?: string
    description?: string
    account_number?: string
    accountNumber?: string
    transaction_time?: string
    created_at?: string
    transactionDate?: string
    referenceCode?: string
    module_id?: string
    campaign_id?: string
    [key: string]: unknown
}

export interface SepayWebhookHeaders {
    secret?: string
    signature?: string
    timestamp?: string
    rawBody?: string
}

export interface FundraisingModuleOutput {
    id: number
    campaign_id: number
    type: string
    title: string
    status: string
    settings_json: unknown
    total_raised: number
    campaign: {
        id: number
        title: string
        status: string
        slug: string
    }
}

export interface FundraisingModuleConfigOutput {
    module_id: number
    config: Record<string, unknown>
    status: string
}

export interface FundraisingDonationOutput {
    id: number
    campaign_id: number
    module_id: number
    student_id: number
    donor_name: string | null
    amount: number
    payment_code: string | null
    payment_expires_at: Date | null
    message: string | null
    evidence_url: string | null
    status: string
    matched_transaction_id: number | null
    matched_at: Date | null
    verified_by: number | null
    verified_at: Date | null
    reject_reason: string | null
    created_at: Date
    updated_at: Date
    payment_instruction?: {
        receiver_name: string | null
        bank_name: string | null
        bank_account_no: string | null
        amount: number
        currency: string
        payment_code?: string | null
        transfer_content?: string | null
        expires_at?: Date | null
        vietqr_url?: string | null
    }
}

export interface FundraisingDonationListOutput {
    items: FundraisingDonationOutput[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export interface FundraisingTransactionOutput {
    id: number
    provider: string
    provider_transaction_id: string
    campaign_id: number | null
    module_id: number | null
    amount: number
    content: string | null
    account_no: string | null
    transaction_time: Date
    match_status: string
    matched_donation_id: number | null
    created_at: Date
    updated_at: Date
    matched_donation: {
        id: number
        donor_name: string | null
        amount: number
        status: string
        created_at: Date
    } | null
}

export interface FundraisingTransactionListOutput {
    items: FundraisingTransactionOutput[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export interface CreateDonationRecordInput {
    campaignId: bigint
    moduleId: bigint
    studentId: bigint
    donorName: string
    amount: number
    paymentCode?: string | null
    paymentExpiresAt?: Date | null
    message: string | null
    evidenceUrl: string | null
}

export interface SepayWebhookOutput {
    accepted: boolean
    transaction_id: number
    match_status: string
    matched_donation_id: number | null
    raw_payload: Record<string, unknown>
}
