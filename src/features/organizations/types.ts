export interface OrganizationListQuery {
    page?: number
    limit?: number
}

export interface OrganizationFacultySummary {
    id: number
    code: string
    name: string
}

export interface OrganizationListItemOutput {
    id: number
    code: string
    name: string
    type: string
    status: string
    faculty: OrganizationFacultySummary | null
}

export interface OrganizationListOutput {
    items: OrganizationListItemOutput[]
}

export interface OrganizationSlugParams {
    slug: string
}

export interface CampaignSummaryForOrg {
    id: number
    title: string
    slug: string
    summary: string
    status: string
    cover_image_url: string | null
    start_at: Date
    end_at: Date
}

export interface OrganizationDetailOutput {
    id: number
    code: string
    name: string
    type: string
    status: string
    logo_url: string | null
    description: string | null
    faculty: OrganizationFacultySummary | null
    campaigns: CampaignSummaryForOrg[]
}
