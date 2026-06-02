import { Prisma } from '@prisma/client'
import { prismaClient } from 'src/config'

export const toJsonValue = (value: unknown) =>
    value === null || value === undefined
        ? Prisma.JsonNull
        : (value as Prisma.InputJsonValue)

export const findTemplates = async () =>
    prismaClient.certificateTemplate.findMany({
        include: {
            _count: {
                select: {
                    certificates: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    })

export const createTemplate = async (args: {
    name: string
    type: string
    fileUrl: string | null
    layoutJson: unknown
    createdBy: bigint
}) =>
    prismaClient.certificateTemplate.create({
        include: {
            _count: {
                select: {
                    certificates: true,
                },
            },
        },
        data: {
            name: args.name,
            type: args.type,
            fileUrl: args.fileUrl,
            layoutJson: toJsonValue(args.layoutJson),
            createdBy: args.createdBy,
        },
    })

export const findCampaignById = async (campaignId: bigint) =>
    prismaClient.campaign.findUnique({ where: { id: campaignId } })

export const findTemplateById = async (templateId: bigint) =>
    prismaClient.certificateTemplate.findUnique({
        where: { id: templateId },
        include: {
            _count: {
                select: {
                    certificates: true,
                },
            },
        },
    })

export const hasTemplateUsage = async (templateId: bigint) =>
    prismaClient.certificate.count({
        where: {
            templateId,
        },
    }).then((count) => count > 0)

export const findEligibleRegistrations = async (args: {
    campaignId: bigint
    moduleId: bigint | null
}) =>
    prismaClient.eventRegistration.findMany({
        where: {
            campaignId: args.campaignId,
            ...(args.moduleId ? { moduleId: args.moduleId } : {}),
            status: 'COMPLETED',
        },
        include: { student: true },
    })

export const findExistingCertificate = async (args: {
    campaignId: bigint
    moduleId: bigint
    studentId: bigint
}) =>
    prismaClient.certificate.findFirst({
        where: {
            campaignId: args.campaignId,
            moduleId: args.moduleId,
            studentId: args.studentId,
            replacementCertificateId: null,
            status: { not: 'REVOKED' },
        },
    })

export const createCertificate = async (
    data: Prisma.CertificateCreateInput | Prisma.CertificateUncheckedCreateInput
) => prismaClient.certificate.create({ data })

export const createRenderJob = async (certificateId: bigint) =>
    prismaClient.backgroundJob.create({
        data: {
            type: 'RENDER_CERTIFICATE',
            payloadJson: { certificate_id: Number(certificateId) },
            runAt: new Date(),
        },
    })

export const findActiveRenderJob = async (certificateId: bigint) =>
    prismaClient.backgroundJob
        .findMany({
        where: {
            type: 'RENDER_CERTIFICATE',
            status: { in: ['PENDING', 'RUNNING'] },
        },
        orderBy: { createdAt: 'desc' },
    })
        .then((items) =>
            items.find(
                (item) =>
                    Number(
                        (item.payloadJson as Record<string, unknown>)
                            ?.certificate_id ?? 0
                    ) === Number(certificateId)
            ) ?? null
        )

export const findCertificateById = async (id: bigint) =>
    prismaClient.certificate.findUnique({
        where: { id },
        include: {
            student: {
                select: {
                    fullName: true,
                    studentCode: true,
                },
            },
            template: {
                select: {
                    name: true,
                    layoutJson: true,
                    status: true,
                },
            },
            module: {
                select: {
                    title: true,
                },
            },
            campaign: {
                select: {
                    title: true,
                },
            },
        },
    })

export const findBackgroundJobById = async (id: bigint) =>
    prismaClient.backgroundJob.findUnique({ where: { id } })

export const findProcessableBackgroundJobs = async (args?: {
    type?: string
    limit?: number
}) =>
    prismaClient.backgroundJob.findMany({
        where: {
            status: 'PENDING',
            lockedAt: null,
            runAt: { lte: new Date() },
            ...(args?.type ? { type: args.type } : {}),
        },
        orderBy: [{ runAt: 'asc' }, { createdAt: 'asc' }],
        take: args?.limit ?? 10,
    })

export const markBackgroundJobRunning = async (id: bigint) =>
    prismaClient.backgroundJob.update({
        where: { id },
        data: {
            status: 'RUNNING',
            lockedAt: new Date(),
            attempts: { increment: 1 },
            lastError: null,
        },
    })

export const markBackgroundJobCompleted = async (id: bigint) =>
    prismaClient.backgroundJob.update({
        where: { id },
        data: {
            status: 'COMPLETED',
            lockedAt: null,
            lastError: null,
        },
    })

export const markBackgroundJobFailed = async (id: bigint, lastError: string) =>
    prismaClient.backgroundJob.update({
        where: { id },
        data: {
            status: 'FAILED',
            lockedAt: null,
            lastError,
        },
    })

export const resetBackgroundJobForRetry = async (id: bigint) =>
    prismaClient.backgroundJob.update({
        where: { id },
        data: {
            status: 'PENDING',
            lockedAt: null,
            lastError: null,
            runAt: new Date(),
        },
    })

export const findCertificatesByCampaignId = async (campaignId: bigint) =>
    prismaClient.certificate.findMany({
        where: { campaignId },
        include: {
            student: true,
            template: true,
            module: true,
        },
        orderBy: { createdAt: 'desc' },
    })

export const updateCertificate = async (
    id: bigint,
    data: Prisma.CertificateUpdateInput | Prisma.CertificateUncheckedUpdateInput
) => prismaClient.certificate.update({ where: { id }, data })

export const updateTemplate = async (
    id: bigint,
    data: {
        name?: string
        type?: string
        fileUrl?: string | null
        layoutJson?: unknown
        status?: string
    }
) => {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.type !== undefined) updateData.type = data.type
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl
    if (data.layoutJson !== undefined)
        updateData.layoutJson = toJsonValue(data.layoutJson)
    if (data.status !== undefined) updateData.status = data.status
    return prismaClient.certificateTemplate.update({
        where: { id },
        include: {
            _count: {
                select: {
                    certificates: true,
                },
            },
        },
        data: updateData,
    })
}

export const createAuditLog = async (data: {
    actorId: bigint
    action: string
    entityType?: string
    entityId: bigint
    beforeJson?: unknown
    afterJson?: unknown
}) =>
    prismaClient.auditLog.create({
        data: {
            actorType: 'OPERATOR',
            actorId: data.actorId,
            action: data.action,
            entityType: data.entityType ?? 'certificate',
            entityId: data.entityId,
            beforeJson: data.beforeJson
                ? toJsonValue(data.beforeJson)
                : undefined,
            afterJson: data.afterJson ? toJsonValue(data.afterJson) : undefined,
        },
    })
