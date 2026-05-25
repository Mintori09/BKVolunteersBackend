import { createHash } from 'crypto'
import { HttpStatus } from 'src/common/constants'
import { serializeId } from 'src/common/serializers'
import { ApiError } from 'src/utils/ApiError'
import * as certificatesRepository from './certificates.repository'
import { renderCertificatePdf } from './pdf-renderer'
import {
    CreateCertificateTemplateBody,
    GenerateCertificatesBody,
    RevokeCertificateBody,
    UpdateCertificateTemplateBody,
} from './types'

const requireOperator = (payload?: {
    accountType?: string
    userId?: string
}) => {
    if (payload?.accountType !== 'OPERATOR' || !payload.userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản operator')
    }
}

const certificateNo = (campaignId: bigint, studentId: bigint) =>
    `CERT-${campaignId.toString()}-${studentId.toString()}`

const CERTIFICATE_RENDERABLE_STATUSES = new Set(['PENDING', 'FAILED'])
const CERTIFICATE_VERIFYABLE_STATUSES = new Set(['READY', 'SIGNED'])
const CERTIFICATE_REVOCABLE_STATUSES = new Set(['READY', 'SIGNED'])

const buildIssuedDateLabel = (issuedAt: Date) =>
    new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(issuedAt)

type CertificateRecordLike = {
    id: bigint
    certificateNo: string
    campaignId: bigint
    moduleId: bigint | null
    studentId: bigint
    templateId: bigint
    status: string
    snapshotJson: unknown
    fileUrl: string | null
    fileHash: string | null
    issuedAt: Date | null
    revokedAt: Date | null
    revokedBy: bigint | null
    revokeReason: string | null
    replacementCertificateId: bigint | null
    createdAt: Date
    updatedAt: Date
}

type RenderableCertificate = CertificateRecordLike & {
    student?: {
        fullName: string
        studentCode: string
    } | null
    campaign?: {
        title: string
    } | null
    module?: {
        title: string
    } | null
    template?: {
        name: string
        status: string
        layoutJson: unknown
    } | null
}

const buildRenderValues = (
    item: RenderableCertificate
) => {
    const renderedAt = item.issuedAt ?? new Date()

    const snapshot =
        item.snapshotJson && typeof item.snapshotJson === 'object'
            ? (item.snapshotJson as Record<string, unknown>)
            : {}

    return {
        renderedAt,
        values: {
            certificate_no: item.certificateNo,
            student_name:
                String(snapshot.student_name ?? item.student?.fullName ?? '').trim(),
            student_code:
                String(snapshot.student_code ?? item.student?.studentCode ?? '').trim(),
            campaign_title:
                String(snapshot.campaign_title ?? item.campaign?.title ?? '').trim(),
            module_title: String(item.module?.title ?? '').trim(),
            issued_at: buildIssuedDateLabel(renderedAt),
        },
    }
}

const buildRenderArtifact = async (
    item: RenderableCertificate
) => {
    const { renderedAt, values } = buildRenderValues(item)
    const pdfBuffer = renderCertificatePdf({
        certificateNo: item.certificateNo,
        templateName: item.template?.name ?? 'Certificate',
        layoutJson: item.template?.layoutJson,
        values,
    })
    const fileHash = createHash('sha256').update(pdfBuffer).digest('hex')

    return {
        renderedAt,
        fileHash,
        fileUrl: `/api/v1/certificates/${serializeId(item.id)!}/file`,
    }
}

const buildCertificatePdfBuffer = (
    item: RenderableCertificate
) => {
    const { values } = buildRenderValues(item)
    return renderCertificatePdf({
        certificateNo: item.certificateNo,
        templateName: item.template?.name ?? 'Certificate',
        layoutJson: item.template?.layoutJson,
        values,
    })
}

const serializeTemplate = (
    item: Awaited<
        ReturnType<typeof certificatesRepository.findTemplates>
    >[number]
) => ({
    id: serializeId(item.id)!,
    name: item.name,
    type: item.type,
    file_url: item.fileUrl,
    layout_json: item.layoutJson,
    status: item.status,
    is_locked: item._count.certificates > 0,
    created_by: serializeId(item.createdBy),
    created_at: item.createdAt,
    updated_at: item.updatedAt,
})

const serializeCertificate = (
    item: CertificateRecordLike | null
) => {
    if (!item) return null
    return {
        id: serializeId(item.id)!,
        certificate_no: item.certificateNo,
        campaign_id: serializeId(item.campaignId)!,
        module_id: serializeId(item.moduleId),
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
    await certificatesRepository.createAuditLog({
        actorId: BigInt(userId),
        action: 'CERTIFICATE_TEMPLATE_CREATED',
        entityType: 'certificate_template',
        entityId: item.id,
        afterJson: {
            name: item.name,
            type: item.type,
            status: item.status,
        },
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
    const dryRun = Boolean(body.dry_run ?? body.dryRun)
    if (!campaign || campaign.deletedAt) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Campaign not found')
    }
    if (!template) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Template not found')
    }
    if (template.status !== 'ACTIVE') {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Template chứng nhận hiện không còn hoạt động'
        )
    }

    const registrations =
        await certificatesRepository.findEligibleRegistrations({
            campaignId,
            moduleId,
        })
    const candidates = []
    for (const registration of registrations) {
        const existing = await certificatesRepository.findExistingCertificate({
            campaignId,
            moduleId: registration.moduleId,
            studentId: registration.studentId,
        })
        if (existing) continue
        const snapshotJson = {
            campaign_title: campaign.title,
            student_name: registration.student.fullName,
            student_code: registration.student.studentCode,
        }
        candidates.push({
            certificateNo: certificateNo(campaignId, registration.studentId),
            campaignId,
            moduleId: registration.moduleId,
            studentId: registration.studentId,
            templateId,
            snapshotJson,
        })
    }

    if (dryRun) {
        return {
            dry_run: true,
            candidate_count: candidates.length,
            created_count: 0,
            items: candidates.map((candidate, index) => ({
                id: -(index + 1),
                certificate_no: candidate.certificateNo,
                campaign_id: serializeId(candidate.campaignId)!,
                module_id: serializeId(candidate.moduleId)!,
                student_id: serializeId(candidate.studentId)!,
                template_id: serializeId(candidate.templateId)!,
                status: 'PENDING',
                snapshot_json: candidate.snapshotJson,
                file_url: null,
                file_hash: null,
                issued_at: null,
                revoked_at: null,
                revoked_by: null,
                revoke_reason: null,
                replacement_certificate_id: null,
                created_at: new Date(),
                updated_at: new Date(),
            })),
        }
    }

    const created = []
    for (const candidate of candidates) {
        const item = await certificatesRepository.createCertificate({
            certificateNo: candidate.certificateNo,
            campaign: { connect: { id: candidate.campaignId } },
            module: { connect: { id: candidate.moduleId } },
            student: { connect: { id: candidate.studentId } },
            template: { connect: { id: templateId } },
            snapshotJson: candidate.snapshotJson,
        })
        created.push(item)
        await certificatesRepository.createRenderJob(item.id)
        await certificatesRepository.createAuditLog({
            actorId: BigInt(userId),
            action: 'CERTIFICATE_GENERATED',
            entityId: item.id,
            afterJson: {
                status: item.status,
                campaign_id: Number(item.campaignId),
                module_id: Number(item.moduleId),
                student_id: Number(item.studentId),
                template_id: Number(item.templateId),
            },
        })
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
    const userId = payload!.userId!
    const item = await certificatesRepository.findCertificateById(BigInt(idRaw))
    if (!item) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Certificate not found')
    }
    if (!CERTIFICATE_RENDERABLE_STATUSES.has(item.status)) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chỉ có thể render chứng nhận ở trạng thái PENDING hoặc FAILED'
        )
    }

    const activeJob = await certificatesRepository.findActiveRenderJob(item.id)
    if (activeJob) {
        return {
            queued: true,
            certificate_id: serializeId(item.id)!,
            background_job_id: serializeId(activeJob.id)!,
        }
    }

    const job = await certificatesRepository.createRenderJob(item.id)
    await certificatesRepository.createAuditLog({
        actorId: BigInt(userId),
        action: 'CERTIFICATE_RENDER_QUEUED',
        entityId: item.id,
        beforeJson: { status: item.status },
        afterJson: {
            status: item.status,
            background_job_id: Number(job.id),
        },
    })
    return {
        queued: true,
        certificate_id: serializeId(item.id)!,
        background_job_id: serializeId(job.id)!,
    }
}

export const downloadCertificate = async (idRaw: string) => {
    const item = await certificatesRepository.findCertificateById(BigInt(idRaw))
    if (!item) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Certificate not found')
    }
    if (!CERTIFICATE_VERIFYABLE_STATUSES.has(item.status)) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chứng nhận chưa sẵn sàng để tải xuống'
        )
    }
    return {
        id: serializeId(item.id)!,
        certificate_no: item.certificateNo,
        file_url: item.fileUrl,
        status: item.status,
    }
}

export const getCertificateFile = async (idRaw: string) => {
    const item = await certificatesRepository.findCertificateById(BigInt(idRaw))
    if (!item) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Certificate not found')
    }
    if (!CERTIFICATE_VERIFYABLE_STATUSES.has(item.status)) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chứng nhận chưa sẵn sàng để tải xuống'
        )
    }

    return {
        certificateNo: item.certificateNo,
        buffer: buildCertificatePdfBuffer(item),
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
    if (!CERTIFICATE_REVOCABLE_STATUSES.has(current.status)) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chỉ có thể thu hồi chứng nhận đã được phát hành'
        )
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

export const updateTemplate = async (
    idRaw: string,
    body: UpdateCertificateTemplateBody,
    payload?: { accountType?: string; userId?: string }
) => {
    requireOperator(payload)
    const userId = payload!.userId!
    const id = BigInt(idRaw)
    const existing = await certificatesRepository.findTemplateById(id)
    if (!existing) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy template')
    }
    const hasUsage = await certificatesRepository.hasTemplateUsage(id)
    const isChangingStructure =
        (body.type !== undefined && body.type !== existing.type) ||
        (body.file_url !== undefined && body.file_url !== existing.fileUrl) ||
        (body.layout_json !== undefined &&
            JSON.stringify(body.layout_json) !==
                JSON.stringify(existing.layoutJson))

    if (hasUsage && isChangingStructure) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Template đã được dùng để sinh chứng nhận, không thể sửa type, file_url hoặc layout_json'
        )
    }

    const data: Parameters<typeof certificatesRepository.updateTemplate>[1] = {}
    if (body.name !== undefined) data.name = body.name
    if (body.type !== undefined && !hasUsage) data.type = body.type
    if (body.file_url !== undefined && !hasUsage) data.fileUrl = body.file_url
    if (body.layout_json !== undefined && !hasUsage)
        data.layoutJson = body.layout_json
    if (body.status !== undefined) data.status = body.status
    const updated = await certificatesRepository.updateTemplate(id, data)
    await certificatesRepository.createAuditLog({
        actorId: BigInt(userId),
        action: 'CERTIFICATE_TEMPLATE_UPDATED',
        entityType: 'certificate_template',
        entityId: id,
        beforeJson: {
            name: existing.name,
            type: existing.type,
            file_url: existing.fileUrl,
            layout_json: existing.layoutJson,
            status: existing.status,
        },
        afterJson: {
            name: updated.name,
            type: updated.type,
            file_url: updated.fileUrl,
            layout_json: updated.layoutJson,
            status: updated.status,
        },
    })
    return serializeTemplate(updated)
}

export const deleteTemplate = async (
    idRaw: string,
    payload?: { accountType?: string; userId?: string }
) => {
    requireOperator(payload)
    const userId = payload!.userId!
    const id = BigInt(idRaw)
    const existing = await certificatesRepository.findTemplateById(id)
    if (!existing) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy template')
    }
    const updated = await certificatesRepository.updateTemplate(id, {
        status: 'INACTIVE',
    })
    await certificatesRepository.createAuditLog({
        actorId: BigInt(userId),
        action: 'CERTIFICATE_TEMPLATE_DEACTIVATED',
        entityType: 'certificate_template',
        entityId: id,
        beforeJson: {
            status: existing.status,
        },
        afterJson: {
            status: updated.status,
        },
    })
}

export const listCampaignCertificates = async (
    campaignIdRaw: string,
    payload?: { accountType?: string; userId?: string }
) => {
    requireOperator(payload)
    const campaignId = BigInt(campaignIdRaw)
    const campaign = await certificatesRepository.findCampaignById(campaignId)
    if (!campaign || campaign.deletedAt) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Campaign not found')
    }
    const items = await certificatesRepository.findCertificatesByCampaignId(campaignId)
    return items.map((item) => ({
        id: serializeId(item.id)!,
        certificate_no: item.certificateNo,
        campaign_id: serializeId(item.campaignId)!,
        module_id: serializeId(item.moduleId),
        module_title: item.module?.title ?? null,
        student_id: serializeId(item.studentId)!,
        student_name: item.student.fullName,
        student_code: item.student.studentCode,
        template_id: serializeId(item.templateId)!,
        template_name: item.template.name,
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
    }))
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
    if (current.status !== 'REVOKED') {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chỉ có thể cấp lại từ chứng nhận đã thu hồi'
        )
    }
    if (current.replacementCertificateId) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chứng nhận này đã có bản cấp lại'
        )
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
        entityId: id,
        beforeJson: {
            status: current.status,
            replacement_certificate_id: null,
        },
        afterJson: {
            status: current.status,
            replacement_certificate_id: Number(replacement.id),
        },
    })
    await certificatesRepository.createAuditLog({
        actorId: BigInt(userId),
        action: 'CERTIFICATE_GENERATED',
        entityId: replacement.id,
        afterJson: {
            status: replacement.status,
            source: 'REISSUE',
            replacement_for: Number(id),
        },
    })
    return serializeCertificate(replacement)
}

export const processBackgroundJob = async (jobIdRaw: string | bigint) => {
    const jobId = typeof jobIdRaw === 'bigint' ? jobIdRaw : BigInt(jobIdRaw)
    const job = await certificatesRepository.findBackgroundJobById(jobId)
    if (!job) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Background job not found')
    }
    if (job.type !== 'RENDER_CERTIFICATE') {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chỉ hỗ trợ xử lý job render certificate'
        )
    }
    if (!['PENDING', 'FAILED'].includes(job.status)) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Job không ở trạng thái có thể xử lý'
        )
    }

    await certificatesRepository.markBackgroundJobRunning(job.id)

    try {
        const certificateId = BigInt(
            Number((job.payloadJson as Record<string, unknown>)?.certificate_id)
        )
        const certificate =
            await certificatesRepository.findCertificateById(certificateId)
        if (!certificate) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Certificate not found')
        }
        if (certificate.status === 'REVOKED') {
            throw new ApiError(
                HttpStatus.CONFLICT,
                'Không render chứng nhận đã thu hồi'
            )
        }

        await certificatesRepository.updateCertificate(certificate.id, {
            status: 'RENDERING',
        })

        const artifact = await buildRenderArtifact(certificate)
        const updated = await certificatesRepository.updateCertificate(
            certificate.id,
            {
                status: 'READY',
                issuedAt: certificate.issuedAt ?? artifact.renderedAt,
                fileHash: artifact.fileHash,
                fileUrl: artifact.fileUrl,
            }
        )

        await certificatesRepository.markBackgroundJobCompleted(job.id)
        await certificatesRepository.createAuditLog({
            actorId: 0n,
            action: 'CERTIFICATE_RENDERED',
            entityId: certificate.id,
            beforeJson: { status: certificate.status },
            afterJson: { status: updated.status, file_hash: updated.fileHash },
        })

        return {
            id: serializeId(job.id)!,
            type: job.type,
            status: 'COMPLETED',
            certificate_id: serializeId(certificate.id)!,
        }
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Render certificate failed'
        const certificateId = Number(
            (job.payloadJson as Record<string, unknown>)?.certificate_id ?? 0
        )
        if (certificateId > 0) {
            const certificate = await certificatesRepository.findCertificateById(
                BigInt(certificateId)
            )
            if (certificate && certificate.status !== 'REVOKED') {
                await certificatesRepository.updateCertificate(certificate.id, {
                    status: 'FAILED',
                })
                await certificatesRepository.createAuditLog({
                    actorId: 0n,
                    action: 'CERTIFICATE_RENDER_FAILED',
                    entityId: certificate.id,
                    beforeJson: { status: certificate.status },
                    afterJson: { status: 'FAILED', error: message },
                })
            }
        }
        await certificatesRepository.markBackgroundJobFailed(job.id, message)
        throw error
    }
}

export const retryBackgroundJob = async (jobIdRaw: string | bigint) => {
    const jobId = typeof jobIdRaw === 'bigint' ? jobIdRaw : BigInt(jobIdRaw)
    const job = await certificatesRepository.findBackgroundJobById(jobId)
    if (!job) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Background job not found')
    }
    if (job.status !== 'FAILED') {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chỉ có thể retry job đang FAILED'
        )
    }
    const certificateId = Number(
        (job.payloadJson as Record<string, unknown>)?.certificate_id ?? 0
    )
    if (certificateId > 0) {
        await certificatesRepository.createAuditLog({
            actorId: 0n,
            action: 'CERTIFICATE_RENDER_RETRIED',
            entityId: BigInt(certificateId),
            afterJson: { background_job_id: Number(job.id) },
        })
    }
    await certificatesRepository.resetBackgroundJobForRetry(job.id)
    return processBackgroundJob(job.id)
}

export const processDueBackgroundJobs = async (args?: {
    type?: string
    limit?: number
}) => {
    const jobs = await certificatesRepository.findProcessableBackgroundJobs({
        type: args?.type,
        limit: args?.limit,
    })

    const processed = []
    const failed = []

    for (const job of jobs) {
        try {
            processed.push(await processBackgroundJob(job.id))
        } catch (error) {
            failed.push({
                id: serializeId(job.id)!,
                error: error instanceof Error ? error.message : 'Unknown error',
            })
        }
    }

    return {
        queued: jobs.length,
        processed_count: processed.length,
        failed_count: failed.length,
        items: processed,
        failed,
    }
}
