import {
    CertificateStatus,
    CertificateType,
    OrganizerType,
    Prisma,
} from '@prisma/client'
import { prismaClient } from 'src/config'

const BASE_TEMPLATE_IDS = ['tpl-1', 'tpl-2', 'tpl-3']
const BASE_CERTIFICATE_IDS = ['cert-1', 'cert-2', 'cert-3']

const buildDataUrl = (code: string) =>
    `data:text/plain;charset=utf-8,Certificate%20${encodeURIComponent(code)}%20-%20BKVolunteers`

const toJsonValue = (
    value: Record<string, unknown> | null | undefined
): Prisma.InputJsonValue => (value ?? {}) as Prisma.InputJsonValue

const mapTemplateType = (value?: string | null): CertificateType => {
    if (value === 'DONOR' || value === 'DONOR_CERTIFICATE') {
        return 'DONOR_CERTIFICATE'
    }

    if (value === 'ORGANIZER' || value === 'ORGANIZER_CERTIFICATE') {
        return 'ORGANIZER_CERTIFICATE'
    }

    if (value === 'PARTNER' || value === 'PARTNER_CERTIFICATE') {
        return 'PARTNER_CERTIFICATE'
    }

    return 'VOLUNTEER_COMPLETION'
}

const templateInclude = {
    versions: {
        where: {
            isActive: true,
        },
        orderBy: {
            versionNumber: 'desc' as const,
        },
        take: 1,
    },
    certificates: {
        select: {
            id: true,
        },
    },
} satisfies Prisma.CertificateTemplateInclude

const certificateInclude = {
    campaign: true,
    module: true,
    template: true,
    recipientStudent: true,
    reissuedCertificates: {
        select: {
            id: true,
        },
    },
} satisfies Prisma.CertificateInclude

type TemplateRecord = Prisma.CertificateTemplateGetPayload<{
    include: typeof templateInclude
}>

type CertificateRecord = Prisma.CertificateGetPayload<{
    include: typeof certificateInclude
}>

type EligibleCertificatePreview = {
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

const mapTemplate = (item: TemplateRecord) => {
    const activeVersion = item.versions[0]

    return {
        id: item.id,
        name: item.name,
        type: item.certificateType,
        file_url: null,
        layout_json:
            (activeVersion?.renderConfigJson as Record<
                string,
                unknown
            > | null) ?? null,
        status: item.isActive ? 'ACTIVE' : 'INACTIVE',
        is_locked: item.certificates.length > 0,
        created_by: item.ownerManagerAccountId ?? null,
        created_at: item.createdAt.toISOString(),
        updated_at: item.updatedAt.toISOString(),
    }
}

const mapCertificate = (item: CertificateRecord) => ({
    id: item.id,
    certificate_no: item.serialNumber,
    campaign_id: item.campaignId ?? '',
    module_id: item.moduleId ?? null,
    module_title: item.module?.title ?? null,
    student_id: item.recipientStudentId ?? '',
    student_name: item.recipientName,
    student_code: item.recipientStudent?.mssv ?? '',
    template_id: item.templateId,
    template_name: item.template.name,
    status: item.status,
    snapshot_json: {},
    file_url: item.signedFileId
        ? `/api/v1/certificates/${item.id}/download`
        : buildDataUrl(item.serialNumber),
    file_hash: item.checksumSha256 ?? null,
    issued_at: item.issuedAt?.toISOString() ?? null,
    revoked_at: item.revokedAt?.toISOString() ?? null,
    revoked_by: item.createdById ?? null,
    revoke_reason: item.revocationReason ?? null,
    replacement_certificate_id: item.reissuedCertificates[0]?.id ?? null,
    created_at: item.createdAt.toISOString(),
    updated_at: item.updatedAt.toISOString(),
})

const getStudentByUserId = async (userId: string) =>
    prismaClient.student.findUnique({
        where: {
            userId,
        },
    })

const getManagerByUserId = async (userId: string) =>
    prismaClient.managerAccount.findUnique({
        where: {
            userId,
        },
    })

const getTemplateWithActiveVersion = async (id: string) =>
    prismaClient.certificateTemplate.findUnique({
        where: {
            id,
        },
        include: templateInclude,
    })

const getCertificateDetail = async (id: string) =>
    prismaClient.certificate.findUnique({
        where: {
            id,
        },
        include: certificateInclude,
    })

const buildSerialNumber = () => {
    const now = new Date()
    const timeFragment = String(now.getTime()).slice(-6)
    return `CERT-${now.getFullYear()}-${timeFragment}`
}

const buildPublicId = () => `public-${crypto.randomUUID()}`

const buildEligibleCertificates = async (
    campaignId: string,
    templateId: string,
    moduleId?: string
): Promise<EligibleCertificatePreview[]> => {
    const template = await prismaClient.certificateTemplate.findUnique({
        where: {
            id: templateId,
        },
        include: {
            versions: {
                where: {
                    isActive: true,
                },
                orderBy: {
                    versionNumber: 'desc',
                },
                take: 1,
            },
        },
    })

    if (!template || !template.versions[0]) {
        return []
    }

    const registrations = await prismaClient.moduleRegistration.findMany({
        where: {
            status: 'COMPLETED',
            module: {
                campaignId,
                ...(moduleId ? { id: moduleId } : {}),
            },
        },
        include: {
            student: true,
            module: true,
        },
        orderBy: {
            submittedAt: 'asc',
        },
    })

    return registrations.map((registration) => ({
        id: `candidate-${registration.id}`,
        certificate_no: `CERT-GEN-${registration.id}`,
        campaign_id: campaignId,
        module_id: registration.moduleId,
        module_title: registration.module.title,
        student_id: registration.studentId,
        student_name: registration.student.fullName,
        student_code: registration.student.mssv,
        template_id: template.id,
        template_name: template.name,
        status: 'PENDING',
        snapshot_json: {
            registration_id: registration.id,
            student_name: registration.student.fullName,
            module_title: registration.module.title,
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
    }))
}

export const resetCertificateStore = async () => {
    await prismaClient.certificate.deleteMany({
        where: {
            reissuedFromCertificateId: 'cert-3',
            id: {
                notIn: BASE_CERTIFICATE_IDS,
            },
        },
    })

    await prismaClient.certificateTemplateVersion.deleteMany({
        where: {
            templateId: {
                notIn: BASE_TEMPLATE_IDS,
            },
        },
    })

    await prismaClient.certificateTemplate.deleteMany({
        where: {
            id: {
                notIn: BASE_TEMPLATE_IDS,
            },
        },
    })

    await prismaClient.certificateRenderJob.deleteMany({
        where: {
            certificateId: {
                in: ['cert-2', 'cert-3'],
            },
        },
    })

    await prismaClient.certificateAuditLog.deleteMany({
        where: {
            certificateId: {
                in: ['cert-2', 'cert-3'],
            },
            action: {
                in: ['RENDER_SUCCESS', 'REVOKED', 'REISSUED'],
            },
        },
    })

    await prismaClient.certificate.update({
        where: {
            id: 'cert-2',
        },
        data: {
            status: 'READY',
            issuedAt: new Date('2026-07-26T08:30:00.000Z'),
            revokedAt: null,
            revocationReason: null,
        },
    })

    await prismaClient.certificate.update({
        where: {
            id: 'cert-3',
        },
        data: {
            status: 'REVOKED',
            issuedAt: new Date('2026-07-12T08:00:00.000Z'),
            revokedAt: new Date('2026-07-20T08:00:00.000Z'),
            revocationReason: 'Cập nhật sai giờ công',
            reissuedFromCertificateId: null,
        },
    })
}

export const listTemplates = async () => {
    const templates = await prismaClient.certificateTemplate.findMany({
        include: templateInclude,
        orderBy: {
            updatedAt: 'desc',
        },
    })

    return templates.map(mapTemplate)
}

export const createTemplate = async (input: {
    name: string
    type: string
    file_url?: string | null
    layout_json?: Record<string, unknown> | null
    created_by?: string | null
}) => {
    const manager = input.created_by
        ? await getManagerByUserId(input.created_by)
        : null

    const created = await prismaClient.certificateTemplate.create({
        data: {
            name: input.name,
            certificateType: mapTemplateType(input.type),
            ownerType: OrganizerType.DOANTRUONG,
            ownerManagerAccountId: manager?.id ?? null,
            description: input.name,
            isActive: true,
            versions: {
                create: {
                    versionNumber: 1,
                    templateSourceType: 'HTML',
                    htmlContent: '<div>Chứng nhận</div>',
                    cssContent: 'body { font-family: serif; }',
                    placeholderWhitelistJson: [
                        'recipientName',
                    ] as Prisma.InputJsonValue,
                    renderConfigJson: toJsonValue(input.layout_json),
                    isActive: true,
                },
            },
        },
        include: templateInclude,
    })

    return mapTemplate(created)
}

export const updateTemplate = async (
    id: string,
    input: {
        name?: string
        type?: string
        file_url?: string | null
        layout_json?: Record<string, unknown> | null
        status?: 'ACTIVE' | 'INACTIVE'
    }
) => {
    const template = await prismaClient.certificateTemplate.findUnique({
        where: {
            id,
        },
        include: {
            versions: {
                orderBy: {
                    versionNumber: 'desc',
                },
            },
        },
    })

    if (!template) {
        return null
    }

    const nextVersionNumber = (template.versions[0]?.versionNumber ?? 0) + 1

    await prismaClient.$transaction(async (tx) => {
        await tx.certificateTemplate.update({
            where: {
                id,
            },
            data: {
                ...(input.name ? { name: input.name } : {}),
                ...(input.type
                    ? { certificateType: mapTemplateType(input.type) }
                    : {}),
                ...(input.status
                    ? { isActive: input.status === 'ACTIVE' }
                    : {}),
            },
        })

        if (input.layout_json !== undefined) {
            await tx.certificateTemplateVersion.updateMany({
                where: {
                    templateId: id,
                },
                data: {
                    isActive: false,
                },
            })

            await tx.certificateTemplateVersion.create({
                data: {
                    templateId: id,
                    versionNumber: nextVersionNumber,
                    templateSourceType: 'HTML',
                    htmlContent: '<div>Chứng nhận</div>',
                    cssContent: 'body { font-family: serif; }',
                    placeholderWhitelistJson: [
                        'recipientName',
                    ] as Prisma.InputJsonValue,
                    renderConfigJson: toJsonValue(input.layout_json),
                    isActive: true,
                },
            })
        }
    })

    const updated = await getTemplateWithActiveVersion(id)

    return updated ? mapTemplate(updated) : null
}

export const deactivateTemplate = async (id: string) =>
    updateTemplate(id, { status: 'INACTIVE' })

export const listCampaignCertificates = async (campaignId: string) => {
    const certificates = await prismaClient.certificate.findMany({
        where: {
            campaignId,
        },
        include: certificateInclude,
        orderBy: {
            createdAt: 'desc',
        },
    })

    return certificates.map(mapCertificate)
}

export const generateCertificates = async (input: {
    campaign_id: string
    template_id: string
    module_id?: string
    dry_run?: boolean
}) => {
    const candidates = await buildEligibleCertificates(
        input.campaign_id,
        input.template_id,
        input.module_id
    )

    if (input.dry_run) {
        return {
            dry_run: true,
            candidate_count: candidates.length,
            created_count: 0,
            items: candidates,
        }
    }

    const template = await prismaClient.certificateTemplate.findUniqueOrThrow({
        where: {
            id: input.template_id,
        },
        include: {
            versions: {
                where: {
                    isActive: true,
                },
                orderBy: {
                    versionNumber: 'desc',
                },
                take: 1,
            },
        },
    })
    const version = template.versions[0]

    if (!version) {
        return {
            dry_run: false,
            candidate_count: candidates.length,
            created_count: 0,
            items: await listCampaignCertificates(input.campaign_id),
        }
    }

    let createdCount = 0

    for (const candidate of candidates) {
        const existing = await prismaClient.certificate.findFirst({
            where: {
                campaignId: candidate.campaign_id,
                moduleId: candidate.module_id,
                recipientStudent: {
                    mssv: candidate.student_code,
                },
                templateId: template.id,
            },
        })

        if (existing) {
            continue
        }

        const [registration, student] = await Promise.all([
            prismaClient.moduleRegistration.findFirst({
                where: {
                    moduleId: candidate.module_id ?? undefined,
                    student: {
                        mssv: candidate.student_code,
                    },
                },
            }),
            prismaClient.student.findFirstOrThrow({
                where: {
                    mssv: candidate.student_code,
                },
            }),
        ])

        const certificate = await prismaClient.certificate.create({
            data: {
                publicId: buildPublicId(),
                serialNumber: `${buildSerialNumber()}-${createdCount}`,
                templateId: template.id,
                templateVersionId: version.id,
                campaignId: candidate.campaign_id,
                moduleId: candidate.module_id,
                recipientStudentId: student.id,
                recipientName: student.fullName,
                certificateType: template.certificateType,
                recipientType: 'STUDENT',
                registrationId: registration?.id ?? null,
                status: 'PENDING',
                deliveryStatus: 'NOT_SENT',
            },
        })

        await prismaClient.certificateSnapshot.create({
            data: {
                certificateId: certificate.id,
                dataJson: candidate.snapshot_json as Prisma.InputJsonValue,
            },
        })

        await prismaClient.certificateAuditLog.create({
            data: {
                certificateId: certificate.id,
                action: 'CREATED',
                actorType: 'system',
                note: 'Tạo chứng nhận từ chính sách cấp tự động',
            },
        })

        createdCount += 1
    }

    return {
        dry_run: false,
        candidate_count: candidates.length,
        created_count: createdCount,
        items: await listCampaignCertificates(input.campaign_id),
    }
}

export const renderCertificate = async (id: string) => {
    const certificate = await prismaClient.certificate.findUnique({
        where: {
            id,
        },
    })

    if (!certificate) {
        return null
    }

    await prismaClient.$transaction(async (tx) => {
        await tx.certificate.update({
            where: {
                id,
            },
            data: {
                status:
                    certificate.status === CertificateStatus.SIGNED
                        ? 'SIGNED'
                        : 'READY',
                issuedAt: certificate.issuedAt ?? new Date(),
            },
        })

        await tx.certificateRenderJob.create({
            data: {
                certificateId: id,
                jobType: 'RENDER',
                status: 'SUCCESS',
                finishedAt: new Date(),
            },
        })

        await tx.certificateAuditLog.create({
            data: {
                certificateId: id,
                action: 'RENDER_SUCCESS',
                actorType: 'system',
                note: 'Đã render chứng nhận',
            },
        })
    })

    return {
        queued: true,
        certificate_id: id,
    }
}

export const getCertificateDownload = async (id: string) => {
    const certificate = await prismaClient.certificate.findUnique({
        where: {
            id,
        },
    })

    if (!certificate) {
        return null
    }

    return {
        id: certificate.id,
        certificate_no: certificate.serialNumber,
        file_url: buildDataUrl(certificate.serialNumber),
        status: certificate.status,
    }
}

export const revokeCertificate = async (
    id: string,
    actorUserId: string,
    reason?: string
) => {
    const [certificate, manager] = await Promise.all([
        getCertificateDetail(id),
        getManagerByUserId(actorUserId),
    ])

    if (!certificate) {
        return null
    }

    const updated = await prismaClient.certificate.update({
        where: {
            id,
        },
        data: {
            status: 'REVOKED',
            revokedAt: new Date(),
            revocationReason: reason ?? null,
            createdById: manager?.id ?? certificate.createdById,
        },
        include: certificateInclude,
    })

    await prismaClient.certificateAuditLog.create({
        data: {
            certificateId: id,
            action: 'REVOKED',
            actorType: 'manager',
            actorId: manager?.id ?? null,
            note: reason ?? 'Thu hồi chứng nhận',
        },
    })

    return mapCertificate(updated)
}

export const reissueCertificate = async (id: string) => {
    const certificate = await prismaClient.certificate.findUnique({
        where: {
            id,
        },
        include: {
            snapshot: true,
        },
    })

    if (!certificate) {
        return null
    }

    const now = new Date()
    const replacement = await prismaClient.certificate.create({
        data: {
            publicId: buildPublicId(),
            serialNumber: `${buildSerialNumber()}-RE`,
            templateId: certificate.templateId,
            templateVersionId: certificate.templateVersionId,
            policyId: certificate.policyId,
            campaignId: certificate.campaignId,
            moduleId: certificate.moduleId,
            recipientStudentId: certificate.recipientStudentId,
            recipientName: certificate.recipientName,
            certificateType: certificate.certificateType,
            recipientType: certificate.recipientType,
            registrationId: certificate.registrationId,
            moneyContributionId: certificate.moneyContributionId,
            itemContributionId: certificate.itemContributionId,
            status: 'READY',
            deliveryStatus: 'NOT_SENT',
            issuedAt: now,
            reissuedFromCertificateId: certificate.id,
            createdById: certificate.createdById,
            snapshot: certificate.snapshot
                ? {
                      create: {
                          snapshotVersion:
                              certificate.snapshot.snapshotVersion + 1,
                          dataJson: certificate.snapshot
                              .dataJson as Prisma.InputJsonValue,
                      },
                  }
                : undefined,
        },
        include: certificateInclude,
    })

    await prismaClient.certificateAuditLog.create({
        data: {
            certificateId: replacement.id,
            action: 'REISSUED',
            actorType: 'system',
            note: 'Cấp lại chứng nhận',
        },
    })

    return mapCertificate(replacement)
}

export const listStudentCertificates = async (userId: string) => {
    const student = await getStudentByUserId(userId)

    if (!student) {
        return []
    }

    const certificates = await prismaClient.certificate.findMany({
        where: {
            recipientStudentId: student.id,
        },
        include: certificateInclude,
        orderBy: {
            createdAt: 'desc',
        },
    })

    return certificates.map((item) => ({
        id: item.id,
        certificateNo: item.serialNumber,
        campaignId: item.campaignId,
        campaignTitle: item.campaign?.title ?? 'Chứng nhận hệ thống',
        moduleTitle: item.module?.title ?? null,
        templateName: item.template.name,
        status: item.status,
        fileUrl: buildDataUrl(item.serialNumber),
        issuedAt: item.issuedAt?.toISOString() ?? null,
        revokedAt: item.revokedAt?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
    }))
}

export const verifyCertificate = async (code: string) => {
    const certificate = await prismaClient.certificate.findFirst({
        where: {
            OR: [{ serialNumber: code }, { publicId: code }],
        },
        include: {
            campaign: true,
        },
    })

    if (!certificate || certificate.status === CertificateStatus.REVOKED) {
        await prismaClient.certificateVerificationLog.create({
            data: {
                certificateId: certificate?.id ?? null,
                publicId: code,
                resultStatus: certificate ? 'REVOKED' : 'NOT_FOUND',
            },
        })

        return {
            valid: false,
            certificate: null,
        }
    }

    await prismaClient.certificateVerificationLog.create({
        data: {
            certificateId: certificate.id,
            publicId: certificate.publicId,
            resultStatus: 'VALID',
        },
    })

    return {
        valid: true,
        certificate: {
            id: certificate.id,
            certificate_no: certificate.serialNumber,
            status: certificate.status,
            student_name: certificate.recipientName,
            campaign_title: certificate.campaign?.title ?? null,
            organization: null,
            issued_at: certificate.issuedAt?.toISOString() ?? null,
        },
    }
}
