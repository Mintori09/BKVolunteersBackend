import { HttpStatus } from 'src/common/constants'
import { serializeId } from 'src/common/serializers'
import { ApiError } from 'src/utils/ApiError'
import * as certificatesRepository from './certificates.repository'
import {
    CreateCertificateTemplateBody,
    GenerateCertificatesBody,
    RevokeCertificateBody,
} from './types'

const requireOperator = (payload?: { accountType?: string; userId?: string }) => {
    if (payload?.accountType !== 'OPERATOR' || !payload.userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản operator')
    }
}

const certificateNo = (campaignId: bigint, studentId: bigint) =>
    `CERT-${campaignId.toString()}-${studentId.toString()}`

const serializeTemplate = (
    item: Awaited<ReturnType<typeof certificatesRepository.findTemplates>>[number]
) => ({
    id: serializeId(item.id)!,
    name: item.name,
    type: item.type,
    file_url: item.fileUrl,
    layout_json: item.layoutJson,
    status: item.status,
    created_by: serializeId(item.createdBy),
    created_at: item.createdAt,
    updated_at: item.updatedAt,
})

const serializeCertificate = (
    item: Awaited<ReturnType<typeof certificatesRepository.findCertificateById>>
) => {
    if (!item) return null
    return {
        id: serializeId(item.id)!,
        certificate_no: item.certificateNo,
        campaign_id: serializeId(item.campaignId)!,
        module_id: serializeId(item.moduleId)!,
        student_id: serializeId(item.studentId)!,
        template_id: serializeId(item.templateId)!,
        status: item.status,
        snapshot_json: item.snapshotJson,
        file_url: item.fileUrl,
        file_hash: item.fileHash,
        issued_at: item.issuedAt,
        revoked_at: item.revokedAt,
        revoked_by: serializeId(item.revokedBy),
        revoke_reason: item.revokeReason,
        replacement_certificate_id: serializeId(item.replacementCertificateId),
        created_at: item.createdAt,
        updated_at: item.updatedAt,
    }
}

export const listTemplates = async () => {
    const items = await certificatesRepository.findTemplates()
    return items.map(serializeTemplate)
}

export const createTemplate = async (
    body: CreateCertificateTemplateBody,
    payload?: { accountType?: string; userId?: string }
) => {
    requireOperator(payload)
    const userId = payload!.userId!
    const item = await certificatesRepository.createTemplate({
        name: body.name,
        type: body.type ?? 'CAMPAIGN_COMPLETION',
        fileUrl: body.file_url ?? null,
        layoutJson: body.layout_json ?? {},
        createdBy: BigInt(userId),
    })
    return serializeTemplate(item)
}

export const generateCertificates = async (
    campaignIdRaw: string,
    body: GenerateCertificatesBody,
    payload?: { accountType?: string; userId?: string }
) => {
    requireOperator(payload)
    const userId = payload!.userId!
    const campaignId = BigInt(campaignIdRaw)
    const templateId = BigInt(body.template_id ?? body.templateId ?? 0)
    const moduleId = body.module_id ? BigInt(body.module_id) : null
    const campaign = await certificatesRepository.findCampaignById(campaignId)
    const template = await certificatesRepository.findTemplateById(templateId)
    if (!campaign || campaign.deletedAt) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Campaign not found')
    }
    if (!template) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Template not found')
    }

    const registrations = await certificatesRepository.findEligibleRegistrations({
        campaignId,
        moduleId,
    })
    const created = []
    for (const registration of registrations) {
        const existing = await certificatesRepository.findExistingCertificate({
            campaignId,
            moduleId: registration.moduleId,
            studentId: registration.studentId,
        })
        if (existing) continue
        const item = await certificatesRepository.createCertificate({
            certificateNo: certificateNo(campaignId, registration.studentId),
            campaign: { connect: { id: campaignId } },
            module: { connect: { id: registration.moduleId } },
            student: { connect: { id: registration.studentId } },
            template: { connect: { id: templateId } },
            snapshotJson: {
                campaign_title: campaign.title,
                student_name: registration.student.fullName,
                student_code: registration.student.studentCode,
            },
        })
        created.push(item)
        await certificatesRepository.createRenderJob(item.id)
    }
    return {
        created_count: created.length,
        items: created.map((item) => serializeCertificate(item)!),
    }
}

export const renderCertificate = async (
    idRaw: string,
    payload?: { accountType?: string; userId?: string }
) => {
    requireOperator(payload)
    const item = await certificatesRepository.findCertificateById(BigInt(idRaw))
    if (!item) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Certificate not found')
    }
    await certificatesRepository.createRenderJob(item.id)
    return { queued: true, certificate_id: serializeId(item.id)! }
}

export const downloadCertificate = async (idRaw: string) => {
    const item = await certificatesRepository.findCertificateById(BigInt(idRaw))
    if (!item) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Certificate not found')
    }
    return {
        id: serializeId(item.id)!,
        certificate_no: item.certificateNo,
        file_url: item.fileUrl,
        status: item.status,
    }
}

export const revokeCertificate = async (
    idRaw: string,
    body: RevokeCertificateBody,
    payload?: { accountType?: string; userId?: string }
) => {
    requireOperator(payload)
    const userId = payload!.userId!
    const id = BigInt(idRaw)
    const current = await certificatesRepository.findCertificateById(id)
    if (!current) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Certificate not found')
    }
    const updated = await certificatesRepository.updateCertificate(id, {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedBy: BigInt(userId),
        revokeReason: body.reason ?? body.revoke_reason ?? '',
    })
    await certificatesRepository.createAuditLog({
        actorId: BigInt(userId),
        action: 'CERTIFICATE_REVOKED',
        entityId: id,
        beforeJson: { status: current.status },
        afterJson: { status: updated.status },
    })
    return serializeCertificate(updated)
}

export const reissueCertificate = async (
    idRaw: string,
    payload?: { accountType?: string; userId?: string }
) => {
    requireOperator(payload)
    const userId = payload!.userId!
    const id = BigInt(idRaw)
    const current = await certificatesRepository.findCertificateById(id)
    if (!current) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Certificate not found')
    }
    const replacement = await certificatesRepository.createCertificate({
        certificateNo: `${current.certificateNo}-R${Date.now()}`,
        campaignId: current.campaignId,
        moduleId: current.moduleId ?? undefined,
        studentId: current.studentId,
        templateId: current.templateId,
        status: 'PENDING',
        snapshotJson: certificatesRepository.toJsonValue(current.snapshotJson),
    })
    await certificatesRepository.updateCertificate(id, {
        replacementCertificateId: replacement.id,
    })
    await certificatesRepository.createRenderJob(replacement.id)
    await certificatesRepository.createAuditLog({
        actorId: BigInt(userId),
        action: 'CERTIFICATE_REISSUED',
        entityId: replacement.id,
        afterJson: { replacement_for: Number(id) },
    })
    return serializeCertificate(replacement)
}
