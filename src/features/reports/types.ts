export interface CampaignReportParams {
    id: string
}

export interface CampaignReconciliationOutput {
    campaign: {
        id: number
        title: string
        slug: string
        status: string
        organization_id: number
    }
    reconciliation: {
        matched_transactions: number
        unmatched_transactions: number
        total_transaction_amount: number
        matched_transaction_amount: number
        unmatched_transaction_amount: number
        pending_donations: number
        matched_donations: number
        verified_donations: number
        rejected_donations: number
        verified_amount: number
        amount_gap_vs_verified: number
    }
}

export interface SchoolOverviewQuery {
    from?: string
    to?: string
    organization_id?: string
    module_type?: string
    status?: string
}

export interface CampaignReportModuleOutput {
    id: number
    type: string
    status: string
}

export interface CampaignReportOutput {
    campaign: {
        id: number
        title: string
        slug: string
        status: string
    }
    modules: CampaignReportModuleOutput[]
    fundraising: {
        total_verified_amount: number
        total_donations: number
        verified_donations: number
    }
    item_donations: {
        received_quantity: number
    }
    events: {
        registrations: number
        completed_registrations: number
        completed_hours: number
    }
    certificates: {
        issued_total: number
    }
}

export interface SchoolOverviewOutput {
    total_campaigns: number
    total_students: number
    total_organizations: number
    total_money_donations: number
    organization_breakdown: Array<{
        organization_id: number
        organization_name: string
        organization_code: string
        campaign_count: number
        verified_money_amount: number
        received_item_quantity: number
        completed_event_registrations: number
        completed_event_hours: number
        issued_certificates: number
    }>
    module_breakdown: Array<{
        module_type: 'fundraising' | 'item_donation' | 'event'
        campaign_count: number
    }>
    status_breakdown: Array<{
        status: string
        campaign_count: number
    }>
    filters_applied: {
        from?: string
        to?: string
        organization_id?: number
        module_type?: string
        status?: string
    }
}
