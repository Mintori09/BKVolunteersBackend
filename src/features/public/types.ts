export interface PublicCampaignListQuery {
    page?: number
    limit?: number
    q?: string
    organization_id?: string
    module_type?: 'fundraising' | 'item_donation' | 'event'
    status?: 'PUBLISHED' | 'ONGOING'
}

export interface PublicCampaignSlugParams {
    slug: string
}

export interface PublicCertificateVerifyParams {
    certificateNo: string
}

export interface PublicCampaignListItemOutput {
    id: number
    slug: string
    title: string
    summary: string | null
    cover_image_url: string | null
    organization: {
        id: number
        code: string
        name: string
        type: string
        logo_url: string | null
    }
    module_types: string[]
    progress: {
        percent: number
        modules: Array<{
            type: string
            current: number
            target: number
            percent: number
        }>
    }
    beneficiary: string | null
    scope_type: string
    start_at: Date | null
    end_at: Date | null
    status: string
}

export interface PublicCampaignListOutput {
    items: PublicCampaignListItemOutput[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export interface PublicCampaignDetailOutput extends PublicCampaignListItemOutput {
    description: string | null
    published_at?: Date | null
    modules: Array<{
        id: number
        type: string
        title: string
        description: string | null
        status: string
        start_at: Date
        end_at: Date
        settings: Record<string, unknown>
        progress?: {
            type: string
            current: number
            target: number
            percent: number
        }
        cta: {
            enabled: boolean
            label: string
            action: string | null
        }
    }>
}

export interface PublicCertificateVerifyOutput {
    valid: boolean
    certificate: {
        id: number
        certificate_no: string
        status: string
        issued_at: Date | null
        revoked_at: Date | null
        student_id: number
        campaign_id: number
        student_name: string | null
        campaign_title: string | null
        organization: string | null
    } | null
}
