export interface FundraisingModuleParams {
    moduleId: string
}

export interface FundraisingDonationParams {
    id: string
}

export interface FundraisingDonationListQuery {
    page?: number
    limit?: number
}

export interface FundraisingModuleConfigBody {
    settings_json?: Record<string, unknown> | null
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
}

export interface SepayWebhookBody {
    transaction_id?: string
    id?: string
    gateway_transaction_id?: string
    amount?: number
    content?: string
    account_number?: string
    transaction_time?: string
    created_at?: string
    module_id?: string
    campaign_id?: string
    [key: string]: unknown
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
    id: number
    settings_json: unknown
    status: string
}

export interface FundraisingDonationOutput {
    id: number
    campaign_id: number
    module_id: number
    student_id: number
    donor_name: string | null
    amount: number
    message: string | null
    evidence_url: string | null
    status: string
    matched_transaction_id: number | null
    verified_by: number | null
    verified_at: Date | null
    reject_reason: string | null
    created_at: Date
    updated_at: Date
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

export interface SepayWebhookOutput {
    accepted: boolean
    transaction_id: number
    match_status: string
    matched_donation_id: number | null
    raw_payload: Record<string, unknown>
}
