export type CatalogModuleType = 'fundraising' | 'item_donation' | 'event'

export type CatalogCampaignStatus =
    | 'DRAFT'
    | 'SUBMITTED'
    | 'PRE_APPROVED'
    | 'APPROVED'
    | 'REVISION_REQUIRED'
    | 'REJECTED'
    | 'PUBLISHED'
    | 'ONGOING'
    | 'ENDED'
    | 'ARCHIVED'

export type CatalogModuleStatus =
    | 'DRAFT'
    | 'READY'
    | 'APPROVED'
    | 'OPEN'
    | 'CLOSED'
    | 'CANCELLED'

export type CatalogOrganization = {
    id: string
    code: string
    name: string
    type: string
    slug: string
    logo_url: string | null
    description: string | null
    faculty: { id: string; name: string } | null
    status: string
}

export type CatalogCampaignModule = {
    id: string
    type: CatalogModuleType
    title: string
    description: string | null
    status: CatalogModuleStatus
    start_at: string
    end_at: string
    settings: Record<string, unknown>
    progress: {
        current: number
        target: number
        percent: number
    }
    cta: {
        enabled: boolean
        label: string
        action: string | null
    }
    report: {
        verified_money_amount?: number
        total_donations?: number
        verified_donations?: number
        received_item_quantity?: number
        registrations?: number
        completed_registrations?: number
        completed_hours?: number
    }
}

export type CatalogReview = {
    id: string
    module_id?: string | null
    body: string
    visibility: 'INTERNAL' | 'PUBLIC'
    attachment_url?: string | null
    created_at: string
}

export type CatalogCampaign = {
    id: string
    slug: string
    title: string
    summary: string
    description: string | null
    cover_image_url: string | null
    beneficiary: string | null
    scope_type: 'FACULTY' | 'SCHOOL' | 'PUBLIC'
    status: CatalogCampaignStatus
    start_at: string
    end_at: string
    published_at: string | null
    organization_id: string
    module_types: CatalogModuleType[]
    modules: CatalogCampaignModule[]
    reviews: CatalogReview[]
    issued_certificates: number
}

export type CatalogApproval = {
    id: string
    campaign_id: string
    status: 'SUBMITTED' | 'PRE_APPROVED'
    submitted_at: string
}

export type CatalogStudentActivity = {
    id: string
    activity_type:
        | 'money_donation'
        | 'item_pledge'
        | 'event_registration'
        | 'certificate'
    reference_id: string
    campaign_id: string | null
    campaign_title: string
    campaign_slug: string
    module_id: string | null
    module_title: string
    module_type: string | null
    status: string
    occurred_at: string
    meta: Record<string, unknown>
}

export type CatalogStudentDonation = {
    id: string
    donation_type: 'money' | 'item'
    reference_id: string
    campaign_id: string | null
    campaign_title: string
    campaign_slug: string
    module_id: string | null
    module_title: string
    status: string
    occurred_at: string
    meta: Record<string, unknown>
}
