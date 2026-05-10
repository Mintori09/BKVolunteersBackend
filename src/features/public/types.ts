export interface PublicCampaignListQuery {
    page?: number
    limit?: number
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
    modules: Array<Record<string, never>>
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
    } | null
}
