export type FundraisingDonationRecord = {
    id: string
    module_id: string
    campaign_id: string
    student_id: string
    donor_name: string
    amount: number
    status: 'PENDING' | 'MATCHED' | 'VERIFIED' | 'REJECTED' | 'REFUNDED'
    matched_transaction_id?: string | null
    message?: string | null
    evidence_url?: string | null
    created_at: string
    verified_at?: string | null
    reject_reason?: string | null
    payment_instruction?: {
        payment_code?: string | null
        transfer_content?: string | null
        expires_at?: string | null
        vietqr_url?: string | null
        amount?: number
        currency?: string
    } | null
}

export type FundraisingTransactionRecord = {
    id: string
    provider: string
    provider_transaction_id: string
    campaign_id?: string | null
    module_id?: string | null
    amount: number
    content?: string | null
    account_no?: string | null
    transaction_time: string
    match_status: 'MATCHED' | 'UNMATCHED'
    matched_donation_id?: string | null
}
