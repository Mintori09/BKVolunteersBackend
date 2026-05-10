export interface CertificateIdParams {
    id: string
}

export interface CertificateCampaignParams {
    campaignId: string
}

export interface CreateCertificateTemplateBody {
    name: string
    type?: string
    file_url?: string | null
    layout_json?: Record<string, unknown> | null
}

export interface GenerateCertificatesBody {
    template_id?: string
    templateId?: string
    module_id?: string
}

export interface RevokeCertificateBody {
    reason?: string
    revoke_reason?: string
}

export interface CertificateTemplateOutput {
    id: number
    name: string
    type: string | null
    file_url: string | null
    layout_json: unknown
    status: string
    created_by: number | null
    created_at: Date
    updated_at: Date
}

export interface CertificateOutput {
    id: number
    certificate_no: string
    campaign_id: number
    module_id: number | null
    student_id: number
    template_id: number
    status: string
    snapshot_json: unknown
    file_url: string | null
    file_hash: string | null
    issued_at: Date | null
    revoked_at: Date | null
    revoked_by: number | null
    revoke_reason: string | null
    replacement_certificate_id: number | null
    created_at: Date
    updated_at: Date
}

export interface GenerateCertificatesOutput {
    created_count: number
    items: CertificateOutput[]
}

export interface RenderCertificateOutput {
    queued: boolean
    certificate_id: number
}

export interface DownloadCertificateOutput {
    id: number
    certificate_no: string
    file_url: string | null
    status: string
}
