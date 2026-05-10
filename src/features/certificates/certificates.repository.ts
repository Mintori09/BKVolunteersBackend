import { Prisma } from '@prisma/client'
import { prismaClient } from 'src/config'

export const toJsonValue = (value: unknown) =>
    value === null || value === undefined
        ? Prisma.JsonNull
        : (value as Prisma.InputJsonValue)

export const findTemplates = async () =>
    prismaClient.certificateTemplate.findMany({ orderBy: { createdAt: 'desc' } })

export const createTemplate = async (args: {
    name: string
    type: string
    fileUrl: string | null
    layoutJson: unknown
    createdBy: bigint
}) =>
    prismaClient.certificateTemplate.create({
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
    prismaClient.certificateTemplate.findUnique({ where: { id: templateId } })

export const findEligibleRegistrations = async (args: {
    campaignId: bigint
    moduleId: bigint | null
}) =>
    prismaClient.eventRegistration.findMany({
        where: {
            campaignId: args.campaignId,
            ...(args.moduleId ? { moduleId: args.moduleId } : {}),
            status: 'APPROVED',
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
    data:
        | Prisma.CertificateCreateInput
        | Prisma.CertificateUncheckedCreateInput
) =>
    prismaClient.certificate.create({ data })

export const createRenderJob = async (certificateId: bigint) =>
    prismaClient.backgroundJob.create({
        data: {
            type: 'RENDER_CERTIFICATE',
            payloadJson: { certificate_id: Number(certificateId) },
            runAt: new Date(),
        },
    })

export const findCertificateById = async (id: bigint) =>
    prismaClient.certificate.findUnique({ where: { id } })

export const updateCertificate = async (
    id: bigint,
    data: Prisma.CertificateUpdateInput | Prisma.CertificateUncheckedUpdateInput
) => prismaClient.certificate.update({ where: { id }, data })

export const createAuditLog = async (data: {
    actorId: bigint
    action: string
    entityId: bigint
    beforeJson?: unknown
    afterJson?: unknown
}) =>
    prismaClient.auditLog.create({
        data: {
            actorType: 'OPERATOR',
            actorId: data.actorId,
            action: data.action,
            entityType: 'certificate',
            entityId: data.entityId,
            beforeJson: data.beforeJson ? toJsonValue(data.beforeJson) : undefined,
            afterJson: data.afterJson ? toJsonValue(data.afterJson) : undefined,
        },
    })
