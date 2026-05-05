import { Router, type Request } from 'express'
import { Prisma } from '@prisma/client'
import type { CampaignModuleType, CampaignStatus } from '@prisma/client'
import { prismaClient } from 'src/config'
import {
    requireAccountType,
    requireAuth,
    requireRoles,
} from 'src/common/middleware'
import { ApiResponse } from 'src/utils/ApiResponse'
import type { ContractRole } from 'src/contract/types'

const campaignsRouter = Router()

const CAMPAIGN_VIEW_ROLES: ContractRole[] = [
    'ORG_ADMIN',
    'ORG_MEMBER',
    'SCHOOL_REVIEWER',
    'SCHOOL_ADMIN',
]

const CAMPAIGN_STATUSES: CampaignStatus[] = [
    'DRAFT',
    'SUBMITTED',
    'PRE_APPROVED',
    'APPROVED',
    'REVISION_REQUIRED',
    'REJECTED',
    'PUBLISHED',
    'ONGOING',
    'ENDED',
    'ARCHIVED',
]

const EDITABLE_STATUSES: CampaignStatus[] = ['DRAFT', 'REVISION_REQUIRED']
const CAMPAIGN_MUTATION_ROLES: ContractRole[] = ['ORG_ADMIN']
const MODULE_TYPES: CampaignModuleType[] = ['fundraising', 'item_donation', 'event']

type CampaignFormInput = {
    title?: string
    summary?: string
    description?: string | null
    cover_image_url?: string | null
    beneficiary?: string | null
    scope_type?: 'FACULTY' | 'SCHOOL' | 'PUBLIC'
    start_at?: string
    end_at?: string
}

type ModuleFormInput = {
    type?: CampaignModuleType
    title?: string
    description?: string | null
    start_at?: string
    end_at?: string
    settings?: Record<string, unknown>
}

const toId = (id: bigint | number | string | null | undefined) =>
    id == null ? null : String(id)

const toNumber = (value: unknown) => {
    if (typeof value === 'number') return value
    if (typeof value === 'string') return Number(value) || 0
    if (value && typeof value === 'object' && 'toNumber' in value) {
        return (value as { toNumber: () => number }).toNumber()
    }
    return 0
}

const getPositiveIntQuery = (value: unknown, fallback: number, max?: number) => {
    const parsed = Number(value ?? fallback)
    const normalized = Number.isFinite(parsed) ? Math.floor(parsed) : fallback
    const positive = Math.max(1, normalized)
    return max ? Math.min(max, positive) : positive
}

const parseOptionalBigIntQuery = (value: unknown) => {
    if (value == null || value === '') return undefined
    const raw = Array.isArray(value) ? value[0] : String(value)
    if (!/^\d+$/.test(raw)) return null
    return BigInt(raw)
}

const parseBigIntParam = (value: unknown) => {
    if (value == null) return null
    const raw = Array.isArray(value) ? value[0] : String(value)
    if (!/^\d+$/.test(raw)) return null
    return BigInt(raw)
}

const parseDateInput = (value?: string) => {
    if (!value) return null
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
}

const toJsonInput = (
    value: unknown
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
    if (value == null) return undefined
    return value as Prisma.InputJsonValue
}

const toSettingsObject = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {}

const slugify = (value: string) =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || `campaign-${Date.now()}`

const buildUniqueSlug = async (title: string, exceptId?: bigint) => {
    const base = slugify(title)
    let slug = base
    let index = 1

    // Avoid slug collision in a deterministic way.
    while (true) {
        const existed = await prismaClient.campaign.findUnique({
            where: { slug },
            select: { id: true },
        })

        if (!existed || (exceptId && existed.id === exceptId)) {
            return slug
        }

        index += 1
        slug = `${base}-${index}`
    }
}

const hasCampaignViewAccess = (
    req: Request,
    organizationId: bigint
) => {
    const role = req.payload?.role
    if (role === 'SCHOOL_ADMIN' || role === 'SCHOOL_REVIEWER') return true

    return (
        role === 'ORG_ADMIN' ||
        role === 'ORG_MEMBER'
    )
        ? String(req.payload?.organizationId) === String(organizationId)
        : false
}

const getSettingNumber = (
    settings: unknown,
    snakeKey: string,
    camelKey: string
) => {
    const data = settings && typeof settings === 'object'
        ? (settings as Record<string, unknown>)
        : {}
    return toNumber(data[snakeKey] ?? data[camelKey])
}

const validateCampaignPayload = (
    payload: CampaignFormInput,
    partial = false
) => {
    const details: Array<{ field: string; message: string }> = []

    if (!partial || payload.title !== undefined) {
        if (!payload.title || payload.title.trim().length < 6) {
            details.push({
                field: 'title',
                message: 'title must be at least 6 characters',
            })
        }
    }

    if (!partial || payload.summary !== undefined) {
        if (!payload.summary || payload.summary.trim().length < 10) {
            details.push({
                field: 'summary',
                message: 'summary must be at least 10 characters',
            })
        }
    }

    if (!partial || payload.scope_type !== undefined) {
        if (
            payload.scope_type &&
            !['FACULTY', 'SCHOOL', 'PUBLIC'].includes(payload.scope_type)
        ) {
            details.push({
                field: 'scope_type',
                message: 'scope_type must be FACULTY, SCHOOL or PUBLIC',
            })
        }
    }

    const startAt = payload.start_at !== undefined
        ? parseDateInput(payload.start_at)
        : undefined
    const endAt = payload.end_at !== undefined
        ? parseDateInput(payload.end_at)
        : undefined

    if (payload.start_at !== undefined && !startAt) {
        details.push({
            field: 'start_at',
            message: 'start_at must be a valid datetime',
        })
    }

    if (payload.end_at !== undefined && !endAt) {
        details.push({
            field: 'end_at',
            message: 'end_at must be a valid datetime',
        })
    }

    if (startAt && endAt && startAt >= endAt) {
        details.push({
            field: 'time_range',
            message: 'start_at must be before end_at',
        })
    }

    return details
}

const validateModuleSettings = (
    type: CampaignModuleType,
    settings: unknown
) => {
    const details: Array<{ field: string; message: string }> = []
    const data = settings && typeof settings === 'object'
        ? (settings as Record<string, unknown>)
        : {}

    if (type === 'fundraising') {
        const targetAmount = getSettingNumber(data, 'target_amount', 'targetAmount')
        if (targetAmount <= 0) {
            details.push({
                field: 'settings.target_amount',
                message: 'target_amount must be greater than 0',
            })
        }
        if (!data.receiver_name) {
            details.push({
                field: 'settings.receiver_name',
                message: 'receiver_name is required for fundraising module',
            })
        }
        if (!data.bank_name) {
            details.push({
                field: 'settings.bank_name',
                message: 'bank_name is required for fundraising module',
            })
        }
        if (!data.bank_account_no) {
            details.push({
                field: 'settings.bank_account_no',
                message: 'bank_account_no is required for fundraising module',
            })
        }
    }

    if (type === 'item_donation') {
        if (!data.receiver_address) {
            details.push({
                field: 'settings.receiver_address',
                message: 'receiver_address is required for item donation module',
            })
        }
        if (!data.receiver_contact) {
            details.push({
                field: 'settings.receiver_contact',
                message: 'receiver_contact is required for item donation module',
            })
        }
    }

    if (type === 'event') {
        const quota = getSettingNumber(data, 'quota', 'quota')
        if (quota <= 0) {
            details.push({
                field: 'settings.quota',
                message: 'quota must be greater than 0 for event module',
            })
        }
        if (!data.location) {
            details.push({
                field: 'settings.location',
                message: 'location is required for event module',
            })
        }
    }

    return details
}

const validateModulePayload = (
    payload: ModuleFormInput,
    partial = false
) => {
    const details: Array<{ field: string; message: string }> = []

    if (!partial || payload.type !== undefined) {
        if (!payload.type || !MODULE_TYPES.includes(payload.type)) {
            details.push({
                field: 'type',
                message: 'type must be fundraising, item_donation or event',
            })
        }
    }

    if (!partial || payload.title !== undefined) {
        if (!payload.title || payload.title.trim().length < 4) {
            details.push({
                field: 'title',
                message: 'title must be at least 4 characters',
            })
        }
    }

    const startAt = payload.start_at !== undefined
        ? parseDateInput(payload.start_at)
        : undefined
    const endAt = payload.end_at !== undefined
        ? parseDateInput(payload.end_at)
        : undefined

    if (payload.start_at !== undefined && !startAt) {
        details.push({
            field: 'start_at',
            message: 'start_at must be a valid datetime',
        })
    }

    if (payload.end_at !== undefined && !endAt) {
        details.push({
            field: 'end_at',
            message: 'end_at must be a valid datetime',
        })
    }

    if (startAt && endAt && startAt >= endAt) {
        details.push({
            field: 'time_range',
            message: 'start_at must be before end_at',
        })
    }

    if (!partial || payload.settings !== undefined) {
        if (!payload.settings || typeof payload.settings !== 'object') {
            details.push({
                field: 'settings',
                message: 'settings must be an object',
            })
        } else if (payload.type) {
            details.push(...validateModuleSettings(payload.type, payload.settings))
        }
    }

    return details
}

const validateModuleWindowInsideCampaign = (
    campaignStartAt: Date,
    campaignEndAt: Date,
    moduleStartAt: Date,
    moduleEndAt: Date
) => {
    return (
        moduleStartAt >= campaignStartAt &&
        moduleEndAt <= campaignEndAt &&
        moduleStartAt < moduleEndAt
    )
}

const calculateCampaignProgress = async (modules: Array<{
    id: bigint
    type: CampaignModuleType
    settingsJson: unknown
}>) => {
    const moduleProgress = await Promise.all(
        modules.map(async (module) => {
            if (module.type === 'fundraising') {
                const target = getSettingNumber(
                    module.settingsJson,
                    'target_amount',
                    'targetAmount'
                )
                const verified = await prismaClient.moneyDonation.aggregate({
                    where: { moduleId: module.id, status: 'VERIFIED' },
                    _sum: { amount: true },
                })
                const current = toNumber(verified._sum.amount)
                return {
                    type: module.type,
                    current,
                    target,
                    percent: target > 0
                        ? Math.min(100, Math.round((current / target) * 100))
                        : 0,
                }
            }

            if (module.type === 'item_donation') {
                const targets = await prismaClient.itemTarget.aggregate({
                    where: { moduleId: module.id },
                    _sum: { targetQuantity: true, receivedQuantity: true },
                })
                const target = toNumber(targets._sum.targetQuantity)
                const current = toNumber(targets._sum.receivedQuantity)
                return {
                    type: module.type,
                    current,
                    target,
                    percent: target > 0
                        ? Math.min(100, Math.round((current / target) * 100))
                        : 0,
                }
            }

            const quota = getSettingNumber(module.settingsJson, 'quota', 'quota')
            const completed = await prismaClient.eventRegistration.count({
                where: { moduleId: module.id, status: 'COMPLETED' },
            })
            return {
                type: module.type,
                current: completed,
                target: quota,
                percent: quota > 0
                    ? Math.min(100, Math.round((completed / quota) * 100))
                    : 0,
            }
        })
    )

    const percent = moduleProgress.length > 0
        ? Math.round(
            moduleProgress.reduce((sum, item) => sum + item.percent, 0) /
            moduleProgress.length
        )
        : 0

    return {
        percent,
        modules: moduleProgress,
    }
}

const createAuditLog = async (input: {
    actorType: 'STUDENT' | 'OPERATOR'
    actorId: bigint
    action: string
    entityType: string
    entityId?: bigint
    beforeJson?: unknown
    afterJson?: unknown
    ipAddress?: string | null
}) => {
    await prismaClient.auditLog.create({
        data: {
            actorType: input.actorType,
            actorId: input.actorId,
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            beforeJson: toJsonInput(input.beforeJson),
            afterJson: toJsonInput(input.afterJson),
            ipAddress: input.ipAddress ?? undefined,
        },
    })
}

campaignsRouter.get(
    '/',
    requireAuth,
    requireRoles(CAMPAIGN_VIEW_ROLES),
    async (req, res, next) => {
        try {
            const role = req.payload?.role
            const page = getPositiveIntQuery(req.query.page, 1)
            const limit = getPositiveIntQuery(req.query.limit, 10, 50)
            const q = String(req.query.q ?? '').trim()
            const moduleType = String(req.query.module_type ?? '')
            const status = String(req.query.status ?? '')
            const organizationIdQuery = parseOptionalBigIntQuery(req.query.organization_id)

            if (organizationIdQuery === null) {
                return ApiResponse.error(
                    res,
                    'organization_id must be a positive integer',
                    400,
                    { organization_id: req.query.organization_id },
                    'CAMPAIGN_INVALID_FILTER'
                )
            }

            if (status && !CAMPAIGN_STATUSES.includes(status as CampaignStatus)) {
                return ApiResponse.error(
                    res,
                    'status must be a valid campaign status',
                    400,
                    { status },
                    'CAMPAIGN_INVALID_FILTER'
                )
            }

            const organizationId =
                role === 'ORG_ADMIN' || role === 'ORG_MEMBER'
                    ? req.payload?.organizationId
                        ? BigInt(req.payload.organizationId)
                        : null
                    : organizationIdQuery

            if (
                (role === 'ORG_ADMIN' || role === 'ORG_MEMBER') &&
                organizationId == null
            ) {
                return ApiResponse.error(
                    res,
                    'Current account does not have organization scope',
                    403,
                    undefined,
                    'FORBIDDEN_ORGANIZATION_SCOPE'
                )
            }

            const where = {
                deletedAt: null,
                ...(organizationId != null && { organizationId }),
                ...(status && {
                    status: status as CampaignStatus,
                }),
                ...(MODULE_TYPES.includes(moduleType as CampaignModuleType) && {
                    modules: {
                        some: {
                            type: moduleType as CampaignModuleType,
                            deletedAt: null,
                        },
                    },
                }),
                ...(q && {
                    OR: [
                        { title: { contains: q } },
                        { summary: { contains: q } },
                        { organization: { name: { contains: q } } },
                    ],
                }),
            }

            const [total, campaigns] = await Promise.all([
                prismaClient.campaign.count({ where }),
                prismaClient.campaign.findMany({
                    where,
                    include: {
                        organization: true,
                        modules: {
                            where: { deletedAt: null },
                            orderBy: { startAt: 'asc' },
                        },
                    },
                    orderBy: [{ createdAt: 'desc' }],
                    skip: (page - 1) * limit,
                    take: limit,
                }),
            ])

            const items = await Promise.all(
                campaigns.map(async (campaign) => {
                    const progress = await calculateCampaignProgress(campaign.modules)
                    return {
                        id: toId(campaign.id),
                        slug: campaign.slug,
                        title: campaign.title,
                        summary: campaign.summary,
                        status: campaign.status,
                        scope_type: campaign.scopeType,
                        start_at: campaign.startAt,
                        end_at: campaign.endAt,
                        published_at: campaign.publishedAt,
                        organization: {
                            id: toId(campaign.organization.id),
                            code: campaign.organization.code,
                            name: campaign.organization.name,
                            type: campaign.organization.type,
                        },
                        module_types: campaign.modules.map((module) => module.type),
                        modules_count: campaign.modules.length,
                        progress,
                    }
                })
            )

            return ApiResponse.success(
                res,
                items,
                'Campaigns fetched successfully',
                200,
                {
                    page,
                    limit,
                    total,
                    total_pages: Math.ceil(total / limit),
                }
            )
        } catch (error) {
            next(error)
        }
    }
)

campaignsRouter.post(
    '/',
    requireAuth,
    requireRoles(CAMPAIGN_MUTATION_ROLES),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const organizationId = req.payload?.organizationId
            const actorId = req.payload?.userId

            if (!organizationId || !actorId) {
                return ApiResponse.error(
                    res,
                    'Current account does not have organization scope',
                    403,
                    undefined,
                    'FORBIDDEN_ORGANIZATION_SCOPE'
                )
            }

            const payload = req.body as CampaignFormInput
            const details = validateCampaignPayload(payload)

            if (details.length > 0) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    { details },
                    'CAMPAIGN_VALIDATION_FAILED'
                )
            }

            const startAt = parseDateInput(payload.start_at!)
            const endAt = parseDateInput(payload.end_at!)
            const slug = await buildUniqueSlug(payload.title!)

            const created = await prismaClient.campaign.create({
                data: {
                    organizationId: BigInt(organizationId),
                    title: payload.title!.trim(),
                    slug,
                    summary: payload.summary!.trim(),
                    description: payload.description ?? null,
                    coverImageUrl: payload.cover_image_url ?? null,
                    beneficiary: payload.beneficiary ?? null,
                    scopeType: payload.scope_type ?? 'FACULTY',
                    facultyId: req.payload?.facultyId
                        ? BigInt(req.payload.facultyId)
                        : null,
                    startAt: startAt!,
                    endAt: endAt!,
                    status: 'DRAFT',
                    createdBy: BigInt(actorId),
                },
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(created.id),
                    slug: created.slug,
                    status: created.status,
                    organization_id: toId(created.organizationId),
                    start_at: created.startAt,
                    end_at: created.endAt,
                },
                'Campaign created successfully',
                201
            )
        } catch (error) {
            next(error)
        }
    }
)

campaignsRouter.get(
    '/:id',
    requireAuth,
    requireRoles(CAMPAIGN_VIEW_ROLES),
    async (req, res, next) => {
        try {
            const campaignId = parseBigIntParam(req.params.id)
            if (!campaignId) {
                return ApiResponse.error(
                    res,
                    'campaign id must be a positive integer',
                    400,
                    undefined,
                    'CAMPAIGN_INVALID_ID'
                )
            }

            const campaign = await prismaClient.campaign.findFirst({
                where: {
                    id: campaignId,
                    deletedAt: null,
                },
                include: {
                    organization: true,
                    modules: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: 'asc' },
                    },
                    reviews: {
                        orderBy: { createdAt: 'desc' },
                        take: 20,
                    },
                },
            })

            if (!campaign) {
                return ApiResponse.error(
                    res,
                    'Campaign not found',
                    404,
                    undefined,
                    'CAMPAIGN_NOT_FOUND'
                )
            }

            if (!hasCampaignViewAccess(req, campaign.organizationId)) {
                return ApiResponse.error(
                    res,
                    'You do not have permission to access this campaign',
                    403,
                    undefined,
                    'FORBIDDEN_ORGANIZATION_SCOPE'
                )
            }

            const progress = await calculateCampaignProgress(campaign.modules)

            return ApiResponse.success(
                res,
                {
                    id: toId(campaign.id),
                    organization_id: toId(campaign.organizationId),
                    slug: campaign.slug,
                    title: campaign.title,
                    summary: campaign.summary,
                    description: campaign.description,
                    cover_image_url: campaign.coverImageUrl,
                    beneficiary: campaign.beneficiary,
                    scope_type: campaign.scopeType,
                    status: campaign.status,
                    start_at: campaign.startAt,
                    end_at: campaign.endAt,
                    published_at: campaign.publishedAt,
                    organization: {
                        id: toId(campaign.organization.id),
                        code: campaign.organization.code,
                        name: campaign.organization.name,
                        type: campaign.organization.type,
                    },
                    modules: campaign.modules.map((module) => ({
                        id: toId(module.id),
                        type: module.type,
                        title: module.title,
                        description: module.description,
                        status: module.status,
                        start_at: module.startAt,
                        end_at: module.endAt,
                        settings: module.settingsJson,
                    })),
                    reviews: campaign.reviews.map((review) => ({
                        id: toId(review.id),
                        module_id: toId(review.moduleId),
                        body: review.body,
                        visibility: review.visibility,
                        attachment_url: review.attachmentUrl,
                        created_at: review.createdAt,
                    })),
                    progress,
                },
                'Campaign detail fetched successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

campaignsRouter.patch(
    '/:id',
    requireAuth,
    requireRoles(CAMPAIGN_MUTATION_ROLES),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const campaignId = parseBigIntParam(req.params.id)
            if (!campaignId) {
                return ApiResponse.error(
                    res,
                    'campaign id must be a positive integer',
                    400,
                    undefined,
                    'CAMPAIGN_INVALID_ID'
                )
            }

            const campaign = await prismaClient.campaign.findFirst({
                where: {
                    id: campaignId,
                    deletedAt: null,
                },
            })

            if (!campaign) {
                return ApiResponse.error(
                    res,
                    'Campaign not found',
                    404,
                    undefined,
                    'CAMPAIGN_NOT_FOUND'
                )
            }

            if (String(campaign.organizationId) !== String(req.payload?.organizationId)) {
                return ApiResponse.error(
                    res,
                    'You can only update campaigns in your organization',
                    403,
                    undefined,
                    'FORBIDDEN_ORGANIZATION_SCOPE'
                )
            }

            if (!EDITABLE_STATUSES.includes(campaign.status)) {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    {
                        current_status: campaign.status,
                        allowed_statuses: EDITABLE_STATUSES,
                    },
                    'CAMPAIGN_STATE_CONFLICT'
                )
            }

            const payload = req.body as CampaignFormInput
            const details = validateCampaignPayload(payload, true)
            if (details.length > 0) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    { details },
                    'CAMPAIGN_VALIDATION_FAILED'
                )
            }

            const nextStartAt = payload.start_at
                ? parseDateInput(payload.start_at)
                : campaign.startAt
            const nextEndAt = payload.end_at
                ? parseDateInput(payload.end_at)
                : campaign.endAt

            if (!nextStartAt || !nextEndAt || nextStartAt >= nextEndAt) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    {
                        details: [
                            {
                                field: 'time_range',
                                message: 'start_at must be before end_at',
                            },
                        ],
                    },
                    'CAMPAIGN_VALIDATION_FAILED'
                )
            }

            const nextSlug = payload.title
                ? await buildUniqueSlug(payload.title, campaign.id)
                : campaign.slug

            const updated = await prismaClient.campaign.update({
                where: { id: campaign.id },
                data: {
                    title: payload.title?.trim(),
                    slug: nextSlug,
                    summary: payload.summary?.trim(),
                    description: payload.description,
                    coverImageUrl: payload.cover_image_url,
                    beneficiary: payload.beneficiary,
                    scopeType: payload.scope_type,
                    startAt: nextStartAt,
                    endAt: nextEndAt,
                },
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(updated.id),
                    slug: updated.slug,
                    status: updated.status,
                    updated: true,
                },
                'Campaign updated successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

campaignsRouter.delete(
    '/:id',
    requireAuth,
    requireRoles(CAMPAIGN_MUTATION_ROLES),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const campaignId = parseBigIntParam(req.params.id)
            if (!campaignId) {
                return ApiResponse.error(
                    res,
                    'campaign id must be a positive integer',
                    400,
                    undefined,
                    'CAMPAIGN_INVALID_ID'
                )
            }

            const campaign = await prismaClient.campaign.findFirst({
                where: {
                    id: campaignId,
                    deletedAt: null,
                },
            })

            if (!campaign) {
                return ApiResponse.error(
                    res,
                    'Campaign not found',
                    404,
                    undefined,
                    'CAMPAIGN_NOT_FOUND'
                )
            }

            if (String(campaign.organizationId) !== String(req.payload?.organizationId)) {
                return ApiResponse.error(
                    res,
                    'You can only delete campaigns in your organization',
                    403,
                    undefined,
                    'FORBIDDEN_ORGANIZATION_SCOPE'
                )
            }

            if (!EDITABLE_STATUSES.includes(campaign.status)) {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    {
                        current_status: campaign.status,
                        allowed_statuses: EDITABLE_STATUSES,
                    },
                    'CAMPAIGN_STATE_CONFLICT'
                )
            }

            await prismaClient.campaign.update({
                where: { id: campaign.id },
                data: { deletedAt: new Date() },
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(campaign.id),
                    deleted: true,
                },
                'Campaign deleted successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

campaignsRouter.post(
    '/:id/modules',
    requireAuth,
    requireRoles(CAMPAIGN_MUTATION_ROLES),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const campaignId = parseBigIntParam(req.params.id)
            if (!campaignId) {
                return ApiResponse.error(
                    res,
                    'campaign id must be a positive integer',
                    400,
                    undefined,
                    'CAMPAIGN_INVALID_ID'
                )
            }

            const campaign = await prismaClient.campaign.findFirst({
                where: {
                    id: campaignId,
                    deletedAt: null,
                },
            })

            if (!campaign) {
                return ApiResponse.error(
                    res,
                    'Campaign not found',
                    404,
                    undefined,
                    'CAMPAIGN_NOT_FOUND'
                )
            }

            if (String(campaign.organizationId) !== String(req.payload?.organizationId)) {
                return ApiResponse.error(
                    res,
                    'You can only edit campaigns in your organization',
                    403,
                    undefined,
                    'FORBIDDEN_ORGANIZATION_SCOPE'
                )
            }

            if (!EDITABLE_STATUSES.includes(campaign.status)) {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    {
                        current_status: campaign.status,
                        allowed_statuses: EDITABLE_STATUSES,
                    },
                    'CAMPAIGN_STATE_CONFLICT'
                )
            }

            const payload = req.body as ModuleFormInput
            const details = validateModulePayload(payload)
            if (details.length > 0) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    { details },
                    'CAMPAIGN_MODULE_VALIDATION_FAILED'
                )
            }

            const startAt = parseDateInput(payload.start_at!)
            const endAt = parseDateInput(payload.end_at!)

            if (
                !startAt ||
                !endAt ||
                !validateModuleWindowInsideCampaign(
                    campaign.startAt,
                    campaign.endAt,
                    startAt,
                    endAt
                )
            ) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    {
                        details: [
                            {
                                field: 'time_range',
                                message: 'module time must be inside campaign range',
                            },
                        ],
                    },
                    'CAMPAIGN_MODULE_TIME_RANGE_INVALID'
                )
            }

            const created = await prismaClient.campaignModule.create({
                data: {
                    campaignId: campaign.id,
                    type: payload.type!,
                    title: payload.title!.trim(),
                    description: payload.description ?? null,
                    startAt,
                    endAt,
                    status: 'DRAFT',
                    settingsJson: toJsonInput(payload.settings ?? {}) as Prisma.InputJsonValue,
                },
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(created.id),
                    campaign_id: toId(created.campaignId),
                    type: created.type,
                    status: created.status,
                },
                'Campaign module created successfully',
                201
            )
        } catch (error) {
            next(error)
        }
    }
)

campaignsRouter.patch(
    '/:id/modules/:moduleId',
    requireAuth,
    requireRoles(CAMPAIGN_MUTATION_ROLES),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const campaignId = parseBigIntParam(req.params.id)
            const moduleId = parseBigIntParam(req.params.moduleId)
            if (!campaignId || !moduleId) {
                return ApiResponse.error(
                    res,
                    'campaign id and module id must be positive integers',
                    400,
                    undefined,
                    'CAMPAIGN_MODULE_INVALID_ID'
                )
            }

            const campaign = await prismaClient.campaign.findFirst({
                where: {
                    id: campaignId,
                    deletedAt: null,
                },
            })

            if (!campaign) {
                return ApiResponse.error(
                    res,
                    'Campaign not found',
                    404,
                    undefined,
                    'CAMPAIGN_NOT_FOUND'
                )
            }

            if (String(campaign.organizationId) !== String(req.payload?.organizationId)) {
                return ApiResponse.error(
                    res,
                    'You can only edit campaigns in your organization',
                    403,
                    undefined,
                    'FORBIDDEN_ORGANIZATION_SCOPE'
                )
            }

            if (!EDITABLE_STATUSES.includes(campaign.status)) {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    {
                        current_status: campaign.status,
                        allowed_statuses: EDITABLE_STATUSES,
                    },
                    'CAMPAIGN_STATE_CONFLICT'
                )
            }

            const module = await prismaClient.campaignModule.findFirst({
                where: {
                    id: moduleId,
                    campaignId: campaign.id,
                    deletedAt: null,
                },
            })

            if (!module) {
                return ApiResponse.error(
                    res,
                    'Campaign module not found',
                    404,
                    undefined,
                    'CAMPAIGN_MODULE_NOT_FOUND'
                )
            }

            const payload = req.body as ModuleFormInput
            const nextType = payload.type ?? module.type
            const nextSettings = payload.settings
                ? toSettingsObject(payload.settings)
                : toSettingsObject(module.settingsJson)

            const details = validateModulePayload(
                { ...payload, type: nextType, settings: nextSettings },
                true
            )
            if (details.length > 0) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    { details },
                    'CAMPAIGN_MODULE_VALIDATION_FAILED'
                )
            }

            const nextStartAt = payload.start_at
                ? parseDateInput(payload.start_at)
                : module.startAt
            const nextEndAt = payload.end_at
                ? parseDateInput(payload.end_at)
                : module.endAt

            if (
                !nextStartAt ||
                !nextEndAt ||
                !validateModuleWindowInsideCampaign(
                    campaign.startAt,
                    campaign.endAt,
                    nextStartAt,
                    nextEndAt
                )
            ) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    {
                        details: [
                            {
                                field: 'time_range',
                                message: 'module time must be inside campaign range',
                            },
                        ],
                    },
                    'CAMPAIGN_MODULE_TIME_RANGE_INVALID'
                )
            }

            const updated = await prismaClient.campaignModule.update({
                where: { id: module.id },
                data: {
                    type: nextType,
                    title: payload.title?.trim(),
                    description: payload.description,
                    startAt: nextStartAt,
                    endAt: nextEndAt,
                    settingsJson: toJsonInput(nextSettings) as Prisma.InputJsonValue,
                },
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(updated.id),
                    campaign_id: toId(updated.campaignId),
                    updated: true,
                },
                'Campaign module updated successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

campaignsRouter.post(
    '/:id/submit-review',
    requireAuth,
    requireRoles(CAMPAIGN_MUTATION_ROLES),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const campaignId = parseBigIntParam(req.params.id)
            if (!campaignId) {
                return ApiResponse.error(
                    res,
                    'campaign id must be a positive integer',
                    400,
                    undefined,
                    'CAMPAIGN_INVALID_ID'
                )
            }

            const campaign = await prismaClient.campaign.findFirst({
                where: {
                    id: campaignId,
                    deletedAt: null,
                },
                include: {
                    modules: {
                        where: { deletedAt: null },
                    },
                },
            })

            if (!campaign) {
                return ApiResponse.error(
                    res,
                    'Campaign not found',
                    404,
                    undefined,
                    'CAMPAIGN_NOT_FOUND'
                )
            }

            if (String(campaign.organizationId) !== String(req.payload?.organizationId)) {
                return ApiResponse.error(
                    res,
                    'You can only submit campaigns in your organization',
                    403,
                    undefined,
                    'FORBIDDEN_ORGANIZATION_SCOPE'
                )
            }

            if (!EDITABLE_STATUSES.includes(campaign.status)) {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    {
                        current_status: campaign.status,
                        allowed_statuses: EDITABLE_STATUSES,
                    },
                    'CAMPAIGN_STATE_CONFLICT'
                )
            }

            const readinessErrors: Array<{ field: string; message: string }> = []

            if (campaign.modules.length === 0) {
                readinessErrors.push({
                    field: 'modules',
                    message: 'campaign must have at least one module before submit',
                })
            }

            for (const module of campaign.modules) {
                readinessErrors.push(
                    ...validateModuleSettings(module.type, toSettingsObject(module.settingsJson)).map(
                        (detail) => ({
                            field: `module_${toId(module.id)}.${detail.field}`,
                            message: detail.message,
                        })
                    )
                )
            }

            if (readinessErrors.length > 0) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    { details: readinessErrors },
                    'CAMPAIGN_SUBMIT_VALIDATION_FAILED'
                )
            }

            await prismaClient.$transaction(async (tx) => {
                await tx.campaign.update({
                    where: { id: campaign.id },
                    data: { status: 'SUBMITTED' },
                })

                await tx.campaignModule.updateMany({
                    where: {
                        campaignId: campaign.id,
                        deletedAt: null,
                    },
                    data: {
                        status: 'READY_FOR_REVIEW',
                    },
                })

                await tx.campaignReview.create({
                    data: {
                        campaignId: campaign.id,
                        authorType: 'OPERATOR',
                        authorId: BigInt(req.payload!.userId),
                        body:
                            req.body?.note?.trim() ||
                            'Campaign submitted for school review',
                        visibility: 'INTERNAL',
                    },
                })

                const reviewers = await tx.operatorAccount.findMany({
                    where: {
                        role: { in: ['SCHOOL_ADMIN', 'SCHOOL_REVIEWER'] },
                        deletedAt: null,
                        status: 'ACTIVE',
                    },
                    select: { id: true },
                })

                if (reviewers.length > 0) {
                    await tx.notification.createMany({
                        data: reviewers.map((reviewer) => ({
                            accountType: 'OPERATOR',
                            operatorAccountId: reviewer.id,
                            type: 'CAMPAIGN_SUBMITTED',
                            title: 'Campaign submitted for approval',
                            body: `Campaign "${campaign.title}" is waiting for review.`,
                        dataJson: toJsonInput({
                            campaign_id: toId(campaign.id),
                            organization_id: toId(campaign.organizationId),
                        }) as Prisma.InputJsonValue,
                        })),
                    })
                }

                await createAuditLog({
                    actorType: 'OPERATOR',
                    actorId: BigInt(req.payload!.userId),
                    action: 'CAMPAIGN_SUBMITTED',
                    entityType: 'campaign',
                    entityId: campaign.id,
                    beforeJson: { status: campaign.status },
                    afterJson: { status: 'SUBMITTED' },
                    ipAddress: req.ip,
                })
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(campaign.id),
                    from_status: campaign.status,
                    to_status: 'SUBMITTED',
                },
                'Campaign submitted for review successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

campaignsRouter.post(
    '/:id/publish',
    requireAuth,
    requireRoles(CAMPAIGN_MUTATION_ROLES),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const campaignId = parseBigIntParam(req.params.id)
            if (!campaignId) {
                return ApiResponse.error(
                    res,
                    'campaign id must be a positive integer',
                    400,
                    undefined,
                    'CAMPAIGN_INVALID_ID'
                )
            }

            const campaign = await prismaClient.campaign.findFirst({
                where: {
                    id: campaignId,
                    deletedAt: null,
                },
            })

            if (!campaign) {
                return ApiResponse.error(
                    res,
                    'Campaign not found',
                    404,
                    undefined,
                    'CAMPAIGN_NOT_FOUND'
                )
            }

            if (String(campaign.organizationId) !== String(req.payload?.organizationId)) {
                return ApiResponse.error(
                    res,
                    'You can only publish campaigns in your organization',
                    403,
                    undefined,
                    'FORBIDDEN_ORGANIZATION_SCOPE'
                )
            }

            if (campaign.status !== 'APPROVED') {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    {
                        current_status: campaign.status,
                        allowed_statuses: ['APPROVED'],
                    },
                    'CAMPAIGN_STATE_CONFLICT'
                )
            }

            const publishedAt = new Date()
            const [published] = await prismaClient.$transaction([
                prismaClient.campaign.update({
                    where: { id: campaign.id },
                    data: {
                        status: 'PUBLISHED',
                        publishedAt,
                    },
                }),
                prismaClient.campaignModule.updateMany({
                    where: {
                        campaignId: campaign.id,
                        deletedAt: null,
                        status: {
                            in: ['APPROVED', 'READY_FOR_REVIEW'],
                        },
                    },
                    data: {
                        status: 'OPEN',
                    },
                }),
            ])

            await createAuditLog({
                actorType: 'OPERATOR',
                actorId: BigInt(req.payload!.userId),
                action: 'CAMPAIGN_PUBLISHED',
                entityType: 'campaign',
                entityId: campaign.id,
                beforeJson: { status: campaign.status },
                afterJson: { status: 'PUBLISHED' },
                ipAddress: req.ip,
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(published.id),
                    status: published.status,
                    published_at: published.publishedAt,
                },
                'Campaign published successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

campaignsRouter.post(
    '/:id/end',
    requireAuth,
    requireRoles(CAMPAIGN_MUTATION_ROLES),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const campaignId = parseBigIntParam(req.params.id)
            if (!campaignId) {
                return ApiResponse.error(
                    res,
                    'campaign id must be a positive integer',
                    400,
                    undefined,
                    'CAMPAIGN_INVALID_ID'
                )
            }

            const campaign = await prismaClient.campaign.findFirst({
                where: {
                    id: campaignId,
                    deletedAt: null,
                },
            })

            if (!campaign) {
                return ApiResponse.error(
                    res,
                    'Campaign not found',
                    404,
                    undefined,
                    'CAMPAIGN_NOT_FOUND'
                )
            }

            if (String(campaign.organizationId) !== String(req.payload?.organizationId)) {
                return ApiResponse.error(
                    res,
                    'You can only end campaigns in your organization',
                    403,
                    undefined,
                    'FORBIDDEN_ORGANIZATION_SCOPE'
                )
            }

            if (!['PUBLISHED', 'ONGOING'].includes(campaign.status)) {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    {
                        current_status: campaign.status,
                        allowed_statuses: ['PUBLISHED', 'ONGOING'],
                    },
                    'CAMPAIGN_STATE_CONFLICT'
                )
            }

            const ended = await prismaClient.campaign.update({
                where: { id: campaign.id },
                data: { status: 'ENDED' },
            })

            await createAuditLog({
                actorType: 'OPERATOR',
                actorId: BigInt(req.payload!.userId),
                action: 'CAMPAIGN_ENDED',
                entityType: 'campaign',
                entityId: campaign.id,
                beforeJson: { status: campaign.status, reason: req.body?.reason },
                afterJson: { status: 'ENDED' },
                ipAddress: req.ip,
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(ended.id),
                    status: ended.status,
                },
                'Campaign ended successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

export default campaignsRouter
