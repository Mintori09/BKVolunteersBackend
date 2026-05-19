export interface CampaignReportParams {
    id: string
}

export interface SchoolOverviewQuery {
    page?: number
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
        confirmed_quantity: number
    }
    events: {
        registrations: number
        approved_registrations: number
    }
    certificates: {
        total: number
    }
}

export interface SchoolOverviewOutput {
    total_campaigns: number
    total_students: number
    total_organizations: number
    total_money_donations: number
}
