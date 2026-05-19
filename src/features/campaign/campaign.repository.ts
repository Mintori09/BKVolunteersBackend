import { Prisma } from '@prisma/client'
import prismaClient from 'src/config/prisma'
import {
    CreateCampaignInput,
    CreateCampaignModuleInput,
    UpdateCampaignInput,
    UpdateCampaignModuleInput,
} from './types'

const toId = (value: string | number | bigint) => BigInt(value)

const campaignInclude = {
    organization: {
        select: { id: true, code: true, name: true, type: true, facultyId: true },
    },
    faculty: {
        select: { id: true, code: true, name: true },
    },
    creator: {
        select: { id: true, email: true, fullName: true, role: true },
    },
    approver: {
        select: { id: true, email: true, fullName: true, role: true },
    },
    modules: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' as const },
    },
    reviews: {
        orderBy: { createdAt: 'asc' as const },
    },
} satisfies Prisma.CampaignInclude

export const createCampaign = async (
    data: CreateCampaignInput & {
        organizationId: bigint
        createdBy: bigint
    }
) =>
    prismaClient.campaign.create({
        data: {
            organizationId: data.organizationId,
            title: data.title,
            slug: data.slug,
            summary: data.summary,
            description: data.description ?? null,
            coverImageUrl: data.cover_image_url ?? null,
            beneficiary: data.beneficiary ?? null,
            scopeType: data.scope_type,
            facultyId:
                data.scope_type === 'FACULTY' && data.faculty_id
                    ? BigInt(data.faculty_id)
                    : null,
            startAt: new Date(data.start_at),
            endAt: new Date(data.end_at),
            createdBy: data.createdBy,
        },
        include: campaignInclude,
    })

export const findCampaignById = async (id: string | number | bigint) =>
    prismaClient.campaign.findFirst({
        where: { id: toId(id), deletedAt: null },
        include: campaignInclude,
    })

export const findCampaignBySlug = async (slug: string) =>
    prismaClient.campaign.findFirst({
        where: { slug, deletedAt: null },
        include: campaignInclude,
    })

export const findCampaigns = async (args: {
    where: Prisma.CampaignWhereInput
    page: number
    limit: number
}) => {
    const skip = (args.page - 1) * args.limit
    const [items, total] = await Promise.all([
        prismaClient.campaign.findMany({
            where: args.where,
            skip,
            take: args.limit,
            orderBy: { updatedAt: 'desc' },
            include: campaignInclude,
        }),
        prismaClient.campaign.count({ where: args.where }),
    ])

    return {
        items,
        meta: {
            page: args.page,
            limit: args.limit,
            total,
            totalPages: Math.ceil(total / args.limit),
        },
    }
}

export const updateCampaign = async (
    id: string | number | bigint,
    data: UpdateCampaignInput
) =>
    prismaClient.campaign.update({
        where: { id: toId(id) },
        data: {
            title: data.title,
            slug: data.slug,
            summary: data.summary,
            description: data.description,
            coverImageUrl: data.cover_image_url,
            beneficiary: data.beneficiary,
            scopeType: data.scope_type,
            facultyId:
                data.scope_type === 'FACULTY' && data.faculty_id
                    ? BigInt(data.faculty_id)
                    : data.scope_type === 'SCHOOL'
                      ? null
                      : undefined,
            startAt: data.start_at ? new Date(data.start_at) : undefined,
            endAt: data.end_at ? new Date(data.end_at) : undefined,
        },
        include: campaignInclude,
    })

export const transitionCampaign = async (
    id: string | number | bigint,
    data: {
        status: string
        approvedBy?: bigint | null
        publishedAt?: Date | null
        approvedAt?: Date | null
    }
) =>
    prismaClient.campaign.update({
        where: { id: toId(id) },
        data,
        include: campaignInclude,
    })

export const createReview = async (data: {
    campaignId: bigint
    body: string
    authorId: bigint
    moduleId?: bigint | null
    authorType?: string
    visibility?: string
}) =>
    prismaClient.campaignReview.create({
        data: {
            campaignId: data.campaignId,
            authorType: data.authorType ?? 'OPERATOR',
            authorId: data.authorId,
            body: data.body,
            moduleId: data.moduleId ?? null,
            visibility: data.visibility ?? 'INTERNAL',
        },
    })

export const createActivity = async (data: {
    campaignId: bigint
    actorId: bigint
    activityType: string
    message?: string
    dataJson?: Prisma.InputJsonValue
}) =>
    prismaClient.campaignActivity.create({
        data: {
            campaignId: data.campaignId,
            actorType: 'OPERATOR',
            actorId: data.actorId,
            activityType: data.activityType,
            message: data.message,
            dataJson: data.dataJson,
        },
    })

export const createModule = async (
    campaignId: string | number | bigint,
    data: CreateCampaignModuleInput
) =>
    prismaClient.campaignModule.create({
        data: {
            campaignId: toId(campaignId),
            type: data.type,
            title: data.title,
            description: data.description ?? null,
            startAt: new Date(data.start_at),
            endAt: new Date(data.end_at),
            status: data.status ?? 'DRAFT',
            settingsJson: (data.settings_json ?? {}) as Prisma.InputJsonValue,
        },
    })

export const findModuleById = async (
    campaignId: string | number | bigint,
    moduleId: string | number | bigint
) =>
    prismaClient.campaignModule.findFirst({
        where: {
            id: toId(moduleId),
            campaignId: toId(campaignId),
            deletedAt: null,
        },
    })

export const updateModule = async (
    campaignId: string | number | bigint,
    moduleId: string | number | bigint,
    data: UpdateCampaignModuleInput
) =>
    prismaClient.campaignModule.update({
        where: { id: toId(moduleId) },
        data: {
            campaignId: toId(campaignId),
            title: data.title,
            description: data.description,
            startAt: data.start_at ? new Date(data.start_at) : undefined,
            endAt: data.end_at ? new Date(data.end_at) : undefined,
            status: data.status,
            settingsJson: data.settings_json as Prisma.InputJsonValue | undefined,
        },
    })

export const createAuditLog = async (data: {
    actorId: bigint
    action: string
    entityId: bigint
    beforeJson?: Prisma.InputJsonValue
    afterJson?: Prisma.InputJsonValue
}) =>
    prismaClient.auditLog.create({
        data: {
            actorType: 'OPERATOR',
            actorId: data.actorId,
            action: data.action,
            entityType: 'campaign',
            entityId: data.entityId,
            beforeJson: data.beforeJson,
            afterJson: data.afterJson,
        },
    })
