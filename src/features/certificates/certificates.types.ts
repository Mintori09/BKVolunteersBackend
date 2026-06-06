export type CertificateTemplateStatus = 'ACTIVE' | 'INACTIVE'

export type CertificateTemplateRecord = {
    id: string
    name: string
    type: string
    file_url: string | null
    layout_json: Record<string, unknown> | null
    status: CertificateTemplateStatus
    is_locked: boolean
    created_by: string | null
    created_at: string
    updated_at: string
}

export type CampaignCertificateRecord = {
    id: string
    certificate_no: string
    campaign_id: string
    module_id: string | null
    module_title: string | null
    student_id: string
    student_name: string
    student_code: string
    template_id: string
    template_name: string
    status: string
    snapshot_json: Record<string, unknown>
    file_url: string | null
    file_hash: string | null
    issued_at: string | null
    revoked_at: string | null
    revoked_by: string | null
    revoke_reason: string | null
    replacement_certificate_id: string | null
    created_at: string
    updated_at: string
}
