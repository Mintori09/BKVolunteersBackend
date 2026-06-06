import { catalogCampaigns, catalogOrganizations, catalogStudentActivities } from 'src/features/catalog/catalog.data'
import {
    initialCampaignCertificates,
    initialCertificateTemplates,
} from './certificates.data'
import {
    CampaignCertificateRecord,
    CertificateTemplateRecord,
} from './certificates.types'

let certificateTemplatesStore: CertificateTemplateRecord[] =
    initialCertificateTemplates.map((item) => ({
        ...item,
        layout_json: item.layout_json ? { ...item.layout_json } : null,
    }))

let campaignCertificatesStore: CampaignCertificateRecord[] =
    initialCampaignCertificates.map((item) => ({
        ...item,
        snapshot_json: { ...item.snapshot_json },
    }))

let templateCounter = 100
let certificateCounter = 100

const cloneTemplate = (
    item: CertificateTemplateRecord
): CertificateTemplateRecord => ({
    ...item,
    layout_json: item.layout_json ? { ...item.layout_json } : null,
})

const cloneCertificate = (
    item: CampaignCertificateRecord
): CampaignCertificateRecord => ({
    ...item,
    snapshot_json: { ...item.snapshot_json },
})

const buildDataUrl = (code: string) =>
    `data:text/plain;charset=utf-8,Certificate%20${encodeURIComponent(code)}%20-%20BKVolunteers`

const findTemplate = (id: string) =>
    certificateTemplatesStore.find((item) => item.id === id) ?? null

const templateIsLocked = (templateId: string) =>
    campaignCertificatesStore.some((item) => item.template_id === templateId)

export const resetCertificateStore = () => {
    certificateTemplatesStore = initialCertificateTemplates.map(cloneTemplate)
    campaignCertificatesStore = initialCampaignCertificates.map(cloneCertificate)
    templateCounter = 100
    certificateCounter = 100
}

export const listTemplates = () =>
    certificateTemplatesStore
        .map((item) => ({
            ...cloneTemplate(item),
            is_locked: templateIsLocked(item.id),
        }))
        .sort(
            (left, right) =>
                new Date(right.updated_at).getTime() -
                new Date(left.updated_at).getTime()
        )

export const createTemplate = (input: {
    name: string
    type: string
    file_url?: string | null
    layout_json?: Record<string, unknown> | null
    created_by?: string | null
}) => {
    const now = new Date().toISOString()
    const template: CertificateTemplateRecord = {
        id: `tpl-${templateCounter++}`,
        name: input.name,
        type: input.type,
        file_url: input.file_url ?? null,
        layout_json: input.layout_json ?? null,
        status: 'ACTIVE',
        is_locked: false,
        created_by: input.created_by ?? null,
        created_at: now,
        updated_at: now,
    }

    certificateTemplatesStore = [template, ...certificateTemplatesStore]

    return cloneTemplate(template)
}

export const updateTemplate = (
    id: string,
    input: {
        name?: string
        type?: string
        file_url?: string | null
        layout_json?: Record<string, unknown> | null
        status?: 'ACTIVE' | 'INACTIVE'
    }
) => {
    const existing = findTemplate(id)

    if (!existing) {
        return null
    }

    const locked = templateIsLocked(id)
    const next = {
        ...existing,
        name: input.name ?? existing.name,
        status: input.status ?? existing.status,
        updated_at: new Date().toISOString(),
        ...(locked
            ? {}
            : {
                  type: input.type ?? existing.type,
                  file_url:
                      input.file_url === undefined ? existing.file_url : input.file_url,
                  layout_json:
                      input.layout_json === undefined
                          ? existing.layout_json
                          : input.layout_json,
              }),
    }

    certificateTemplatesStore = certificateTemplatesStore.map((item) =>
        item.id === id ? next : item
    )

    return {
        ...cloneTemplate(next),
        is_locked: locked,
    }
}

export const deactivateTemplate = (id: string) => {
    const updated = updateTemplate(id, { status: 'INACTIVE' })
    return updated
}

export const listCampaignCertificates = (campaignId: string) =>
    campaignCertificatesStore
        .filter((item) => item.campaign_id === campaignId)
        .sort(
            (left, right) =>
                new Date(right.created_at).getTime() -
                new Date(left.created_at).getTime()
        )
        .map(cloneCertificate)

const buildCertificateNo = () => `CERT-2026-${String(certificateCounter++).padStart(3, '0')}`

const buildEligibleCertificates = (campaignId: string, templateId: string, moduleId?: string) => {
    const template = findTemplate(templateId)

    if (!template) {
        return []
    }

    const matchingActivities = catalogStudentActivities.filter((activity) => {
        if (activity.campaign_id !== campaignId) {
            return false
        }

        if (moduleId && activity.module_id !== moduleId) {
            return false
        }

        return (
            activity.status === 'COMPLETED' ||
            activity.status === 'VERIFIED' ||
            activity.status === 'RECEIVED'
        )
    })

    return matchingActivities.map((activity) => {
        const code = buildCertificateNo()

        return {
            id: `cert-${certificateCounter}`,
            certificate_no: code,
            campaign_id: campaignId,
            module_id: activity.module_id,
            module_title: activity.module_title || null,
            student_id: activity.id.replace('activity', 'student'),
            student_name:
                activity.activity_type === 'certificate'
                    ? 'Sinh vien BK'
                    : activity.reference_id === 'REG-2026-001'
                      ? 'Nguyen Van An'
                      : activity.reference_id === 'DON-2026-101'
                        ? 'Le Thi Binh'
                        : 'Pham Quoc Cuong',
            student_code:
                activity.reference_id === 'REG-2026-001'
                    ? '21110001'
                    : activity.reference_id === 'DON-2026-101'
                      ? '21110002'
                      : '21110003',
            template_id: template.id,
            template_name: template.name,
            status: 'PENDING',
            snapshot_json: {
                activity_type: activity.activity_type,
                campaign_title: activity.campaign_title,
            },
            file_url: null,
            file_hash: null,
            issued_at: null,
            revoked_at: null,
            revoked_by: null,
            revoke_reason: null,
            replacement_certificate_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        } satisfies CampaignCertificateRecord
    })
}

export const generateCertificates = (input: {
    campaign_id: string
    template_id: string
    module_id?: string
    dry_run?: boolean
}) => {
    const eligibleItems = buildEligibleCertificates(
        input.campaign_id,
        input.template_id,
        input.module_id
    )

    if (input.dry_run) {
        return {
            dry_run: true,
            candidate_count: eligibleItems.length,
            created_count: 0,
            items: eligibleItems.map(cloneCertificate),
        }
    }

    campaignCertificatesStore = [...eligibleItems, ...campaignCertificatesStore]
    certificateTemplatesStore = certificateTemplatesStore.map((template) =>
        template.id === input.template_id
            ? {
                  ...template,
                  is_locked: true,
                  updated_at: new Date().toISOString(),
              }
            : template
    )

    return {
        dry_run: false,
        candidate_count: eligibleItems.length,
        created_count: eligibleItems.length,
        items: eligibleItems.map(cloneCertificate),
    }
}

export const renderCertificate = (id: string) => {
    const existing = campaignCertificatesStore.find((item) => item.id === id)

    if (!existing) {
        return null
    }

    const next = {
        ...existing,
        status: existing.status === 'SIGNED' ? 'SIGNED' : 'READY',
        file_url: existing.file_url ?? buildDataUrl(existing.certificate_no),
        file_hash: existing.file_hash ?? `hash-${existing.id}`,
        issued_at: existing.issued_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
    }

    campaignCertificatesStore = campaignCertificatesStore.map((item) =>
        item.id === id ? next : item
    )

    return {
        queued: true,
        certificate_id: id,
    }
}

export const getCertificateDownload = (id: string) => {
    const existing = campaignCertificatesStore.find((item) => item.id === id)

    if (!existing) {
        return null
    }

    return {
        id: existing.id,
        certificate_no: existing.certificate_no,
        file_url: existing.file_url ?? buildDataUrl(existing.certificate_no),
        status: existing.status,
    }
}

export const revokeCertificate = (
    id: string,
    actorId: string,
    reason?: string
) => {
    const existing = campaignCertificatesStore.find((item) => item.id === id)

    if (!existing) {
        return null
    }

    const next = {
        ...existing,
        status: 'REVOKED',
        revoked_at: new Date().toISOString(),
        revoked_by: actorId,
        revoke_reason: reason ?? null,
        updated_at: new Date().toISOString(),
    }

    campaignCertificatesStore = campaignCertificatesStore.map((item) =>
        item.id === id ? next : item
    )

    return cloneCertificate(next)
}

export const reissueCertificate = (id: string) => {
    const existing = campaignCertificatesStore.find((item) => item.id === id)

    if (!existing) {
        return null
    }

    const replacementId = `cert-${certificateCounter++}`
    const replacementNo = buildCertificateNo()
    const now = new Date().toISOString()
    const replacement: CampaignCertificateRecord = {
        ...existing,
        id: replacementId,
        certificate_no: replacementNo,
        status: 'READY',
        file_url: buildDataUrl(replacementNo),
        file_hash: `hash-${replacementId}`,
        issued_at: now,
        revoked_at: null,
        revoked_by: null,
        revoke_reason: null,
        replacement_certificate_id: null,
        created_at: now,
        updated_at: now,
    }

    const updatedOriginal = {
        ...existing,
        replacement_certificate_id: replacementId,
        updated_at: now,
    }

    campaignCertificatesStore = [
        replacement,
        ...campaignCertificatesStore.map((item) =>
            item.id === id ? updatedOriginal : item
        ),
    ]

    return cloneCertificate(replacement)
}

export const listStudentCertificates = () =>
    campaignCertificatesStore
        .filter((item) => item.student_code === '21110001' || item.student_code === '21110002')
        .map((item) => {
            const campaign = catalogCampaigns.find(
                (campaignItem) => campaignItem.id === item.campaign_id
            )

            return {
                id: item.id,
                certificateNo: item.certificate_no,
                campaignId: item.campaign_id,
                campaignTitle: campaign?.title ?? 'Unknown campaign',
                moduleTitle: item.module_title,
                templateName: item.template_name,
                status: item.status,
                fileUrl: item.file_url ?? buildDataUrl(item.certificate_no),
                issuedAt: item.issued_at,
                revokedAt: item.revoked_at,
                createdAt: item.created_at,
            }
        })

export const verifyCertificate = (code: string) => {
    const certificate = campaignCertificatesStore.find(
        (item) => item.certificate_no.toLowerCase() === code.toLowerCase()
    )

    if (!certificate || certificate.status === 'REVOKED') {
        return {
            valid: false,
            certificate: null,
        }
    }

    const campaign = catalogCampaigns.find((item) => item.id === certificate.campaign_id)
    const organization = campaign
        ? catalogOrganizations.find((item) => item.id === campaign.organization_id)
        : null

    return {
        valid: true,
        certificate: {
            id: Number(certificate.id.replace(/\D+/g, '')) || 0,
            certificate_no: certificate.certificate_no,
            status: certificate.status,
            student_name: certificate.student_name,
            campaign_title: campaign?.title ?? null,
            organization: organization?.name ?? null,
            issued_at: certificate.issued_at,
        },
    }
}
