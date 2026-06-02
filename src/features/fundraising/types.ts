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
    sepay_bank_account_id?: string | null
    sepay_mode?: 'TRANSFER_CODE' | 'ORDER_VA'
    sepay_va_prefix?: string | null
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
    code?: string
    va?: string
    bank_account_id?: string
    va_id?: string
    webhook_success?: number | boolean
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
    payment_mode: string
    payment_expires_at: Date | null
    message: string | null
    evidence_url: string | null
    status: string
    matched_transaction_id: number | null
    matched_at: Date | null
    sepay_bank_account_id?: string | null
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
        sepay_order_id?: string | null
        virtual_account?: {
            id?: string | null
            va_number: string
            holder_name: string | null
            amount: number
            expires_at: Date | null
            status?: string | null
        } | null
        provider_qr_url?: string | null
    }
    ingest_state?: string | null
    provider_references?: {
        sepay_order_id?: string | null
        sepay_bank_account_id?: string | null
        sepay_virtual_account_id?: string | null
    } | null
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
    ingest_source: string
    sepay_account_id: string | null
    sepay_va_id: string | null
    sepay_order_code: string | null
    reference_number: string | null
    webhook_success: boolean | null
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
    paymentMode?: string
    sepayBankAccountRefId?: bigint | null
    paymentCode?: string | null
    paymentExpiresAt?: Date | null
    message: string | null
    evidenceUrl: string | null
}

export interface SepayApiSyncAccountsQuery {
    q?: string
    bank_short_name?: string
    active?: '1' | '0'
    page?: number
    per_page?: number
}

export interface SepayApiSyncTransactionsBody {
    sepay_bank_account_id?: string
    transaction_date_from?: string
    transaction_date_to?: string
    since_id?: string
    q?: string
    per_page?: number
}

export interface SepayApiSyncVirtualAccountsBody {
    sepay_bank_account_id?: string
    q?: string
    active?: '1' | '0'
    official?: '1' | '0'
    static?: '1' | '0'
    per_page?: number
}

export interface SepayCreateOrderVaBody {
    donation_id: string
}

export interface SepayOperationRequestBody {
    request_type:
        | 'SYNC_ACCOUNTS'
        | 'SYNC_TRANSACTIONS'
        | 'SYNC_VIRTUAL_ACCOUNTS'
        | 'CREATE_ORDER_VA'
        | 'MAP_ACCOUNT'
    sepay_bank_account_id?: string
    campaign_id?: string
    module_id?: string
    donation_id?: string
    note?: string
}

export interface SepayOperationRequestDecisionBody {
    decision_note?: string
}

export interface SepayOperationRequestQuery {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export interface SepayBankAccountOutput {
    id: number
    sepay_account_id: string
    account_holder_name: string
    account_number: string
    accumulated: number | null
    last_transaction: Date | null
    label: string | null
    active: boolean
    bank_short_name: string | null
    bank_full_name: string | null
    bank_code: string | null
    api_mode: string
    metadata_json: unknown
    created_at: Date
    updated_at: Date
}

export interface SepaySyncStatusOutput {
    enabled: boolean
    api_mode: string
    api_base_url: string
    va_enabled: boolean
    order_va_enabled: boolean
    account_count: number
    virtual_account_count: number
    order_payment_count: number
    cursors: Array<{
        type: string
        sepay_bank_account_id: string | null
        cursor_value: string | null
        last_synced_at: Date | null
        last_error: string | null
    }>
}

export interface SepaySyncResultOutput {
    synced_count: number
    matched_count: number
    unmatched_count: number
    failed_count: number
    items: unknown[]
    failed: Array<{
        id: string
        error: string
    }>
}

export interface SepayWebhookOutput {
    accepted: boolean
    transaction_id: number
    match_status: string
    matched_donation_id: number | null
    raw_payload: Record<string, unknown>
}

export interface SepayOperationRequestOutput {
    id: number
    organization_id: number
    requester_id: number
    requester_role: string
    request_type: string
    status: string
    sepay_bank_account_id: string | null
    campaign_id: number | null
    module_id: number | null
    donation_id: number | null
    note: string | null
    decision_note: string | null
    decided_by: number | null
    decided_at: Date | null
    created_at: Date
    updated_at: Date
}
