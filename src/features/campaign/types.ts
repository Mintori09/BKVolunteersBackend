export const CAMPAIGN_STATUS_VALUES = [
    'DRAFT',
    'SUBMITTED',
    'REVISION_REQUIRED',
    'PRE_APPROVED',
    'APPROVED',
    'PUBLISHED',
    'ONGOING',
    'ENDED',
    'REJECTED',
    'CANCELLED',
] as const

export const CAMPAIGN_SCOPE_TYPE_VALUES = ['SCHOOL', 'FACULTY'] as const
export const CAMPAIGN_SCOPE_TYPE_API_VALUES = [
    'SCHOOL',
    'FACULTY',
    'PUBLIC',
] as const

export const CAMPAIGN_MODULE_TYPE_VALUES = [
    'FUNDRAISING',
    'ITEM_DONATION',
    'EVENT',
] as const
export const CAMPAIGN_MODULE_TYPE_API_VALUES = [
    'fundraising',
    'item_donation',
    'event',
] as const

export type CampaignStatus = (typeof CAMPAIGN_STATUS_VALUES)[number]
export type CampaignScopeType = (typeof CAMPAIGN_SCOPE_TYPE_VALUES)[number]
export type CampaignModuleType = (typeof CAMPAIGN_MODULE_TYPE_VALUES)[number]

export interface CreateCampaignInput {
    title: string
    slug?: string
    summary: string
    description?: string | null
    cover_image_url?: string | null
    beneficiary?: string | null
    scope_type: (typeof CAMPAIGN_SCOPE_TYPE_API_VALUES)[number]
    organization_id?: number
    faculty_id?: number | null
    start_at: string
    end_at: string
}

export interface UpdateCampaignInput {
    title?: string
    slug?: string
    summary?: string
    description?: string | null
    cover_image_url?: string | null
    beneficiary?: string | null
    scope_type?: (typeof CAMPAIGN_SCOPE_TYPE_API_VALUES)[number]
    faculty_id?: number | null
    start_at?: string
    end_at?: string
}

export interface CampaignReviewInput {
    comment?: string
}

export interface CreateCampaignModuleInput {
    type: CampaignModuleType | (typeof CAMPAIGN_MODULE_TYPE_API_VALUES)[number]
    title: string
    description?: string | null
    start_at: string
    end_at: string
    status?: string
    settings_json?: Record<string, unknown>
    settings?: Record<string, unknown>
}

export interface UpdateCampaignModuleInput {
    title?: string
    description?: string | null
    start_at?: string
    end_at?: string
    status?: string
    settings_json?: Record<string, unknown>
    settings?: Record<string, unknown>
}

export interface CampaignQuery {
    q?: string
    page?: string
    limit?: string
    status?: CampaignStatus
    scope_type?: (typeof CAMPAIGN_SCOPE_TYPE_API_VALUES)[number]
    module_type?: (typeof CAMPAIGN_MODULE_TYPE_API_VALUES)[number]
    organization_id?: string
    faculty_id?: string
}
