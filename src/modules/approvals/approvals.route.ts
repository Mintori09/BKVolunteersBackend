import { Router, type NextFunction, type Request, type Response } from 'express'
import { Prisma } from '@prisma/client'
import type { CampaignModuleType, CampaignStatus } from '@prisma/client'
import { prismaClient } from 'src/config'
import { requireAuth, requireRoles } from 'src/common/middleware'
import { ApiResponse } from 'src/utils/ApiResponse'

const approvalsRouter = Router()

const REVIEW_ROLES = ['SCHOOL_REVIEWER', 'SCHOOL_ADMIN'] as const
const APPROVAL_STATUSES: CampaignStatus[] = [
    'SUBMITTED',
    'PRE_APPROVED',
    'APPROVED',
    'REVISION_REQUIRED',
    'REJECTED',
]
const MODULE_TYPES: CampaignModuleType[] = ['fundraising', 'item_donation', 'event']

const toId = (id: bigint | number | string | null | undefined) =>
    id == null ? null : String(id)

const getPositiveIntQuery = (value: unknown, fallback: number, max?: number) => {
    const parsed = Number(value ?? fallback)
    const normalized = Number.isFinite(parsed) ? Math.floor(parsed) : fallback
    const positive = Math.max(1, normalized)
    return max ? Math.min(max, positive) : positive
}

const parseBigIntParam = (value: unknown) => {
    if (value == null) return null
    const raw = Array.isArray(value) ? value[0] : String(value)
    if (!/^\d+$/.test(raw)) return null
    return BigInt(raw)
}

const parseOptionalBigIntQuery = (value: unknown) => {
    if (value == null || value === '') return undefined
    const raw = Array.isArray(value) ? value[0] : String(value)
    if (!/^\d+$/.test(raw)) return null
    return BigInt(raw)
}

const toJsonInput = (
    value: unknown
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
    if (value == null) return undefined
    return value as Prisma.InputJsonValue
}

const createAuditLog = async (input: {
    actorId: bigint
    action: string
    entityId: bigint
    beforeStatus: CampaignStatus
    afterStatus: CampaignStatus
    reason?: string
    ipAddress?: string | null
}) => {
    await prismaClient.auditLog.create({
        data: {
            actorType: 'OPERATOR',
            actorId: input.actorId,
            action: input.action,
            entityType: 'campaign',
            entityId: input.entityId,
            beforeJson: toJsonInput({
                status: input.beforeStatus,
                reason: input.reason,
            }),
            afterJson: toJsonInput({
                status: input.afterStatus,
            }),
            ipAddress: input.ipAddress ?? undefined,
        },
    })
}

const notifyOrganizationOperators = async (input: {
    organizationId: bigint
    type: string
    title: string
    body: string
    data: Record<string, unknown>
}) => {
    const operators = await prismaClient.operatorAccount.findMany({
        where: {
            organizationId: input.organizationId,
            deletedAt: null,
            status: 'ACTIVE',
            role: { in: ['ORG_ADMIN', 'ORG_MEMBER'] },
        },
        select: { id: true },
    })

    if (operators.length === 0) return

    await prismaClient.notification.createMany({
        data: operators.map((operator) => ({
            accountType: 'OPERATOR',
            operatorAccountId: operator.id,
            type: input.type,
            title: input.title,
            body: input.body,
            dataJson: toJsonInput(input.data),
        })),
    })
}

approvalsRouter.use(requireAuth, requireRoles([...REVIEW_ROLES]))

approvalsRouter.get('/campaigns', async (req, res, next) => {
    try {
        const page = getPositiveIntQuery(req.query.page, 1)
        const limit = getPositiveIntQuery(req.query.limit, 10, 50)
        const status = String(req.query.status ?? 'SUBMITTED')
        const moduleType = String(req.query.module_type ?? '')
        const organizationIdQuery = parseOptionalBigIntQuery(req.query.organization_id)
        const q = String(req.query.q ?? '').trim()

        if (organizationIdQuery === null) {
            return ApiResponse.error(
                res,
                'organization_id must be a positive integer',
                400,
                { organization_id: req.query.organization_id },
                'APPROVAL_INVALID_FILTER'
            )
        }

        const where = {
            deletedAt: null,
            status: APPROVAL_STATUSES.includes(status as CampaignStatus)
                ? (status as CampaignStatus)
                : 'SUBMITTED',
            ...(organizationIdQuery && { organizationId: organizationIdQuery }),
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
                        orderBy: { createdAt: 'asc' },
                    },
                },
                orderBy: [{ updatedAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
        ])

        return ApiResponse.success(
            res,
            campaigns.map((campaign) => ({
                id: toId(campaign.id),
                slug: campaign.slug,
                title: campaign.title,
                summary: campaign.summary,
                status: campaign.status,
                organization: {
                    id: toId(campaign.organization.id),
                    code: campaign.organization.code,
                    name: campaign.organization.name,
                    type: campaign.organization.type,
                },
                module_types: campaign.modules.map((module) => module.type),
                submitted_at: campaign.updatedAt,
            })),
            'Approval campaigns fetched successfully',
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
})

approvalsRouter.get('/campaigns/:id', async (req, res, next) => {
    try {
        const campaignId = parseBigIntParam(req.params.id)
        if (!campaignId) {
            return ApiResponse.error(
                res,
                'campaign id must be a positive integer',
                400,
                undefined,
                'APPROVAL_INVALID_ID'
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
                    take: 50,
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

        return ApiResponse.success(
            res,
            {
                id: toId(campaign.id),
                slug: campaign.slug,
                title: campaign.title,
                summary: campaign.summary,
                description: campaign.description,
                status: campaign.status,
                start_at: campaign.startAt,
                end_at: campaign.endAt,
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
                comments: campaign.reviews.map((review) => ({
                    id: toId(review.id),
                    module_id: toId(review.moduleId),
                    author_type: review.authorType,
                    body: review.body,
                    visibility: review.visibility,
                    attachment_url: review.attachmentUrl,
                    created_at: review.createdAt,
                })),
            },
            'Approval campaign detail fetched successfully'
        )
    } catch (error) {
        next(error)
    }
})

approvalsRouter.post('/campaigns/:id/comments', async (req, res, next) => {
    try {
        const campaignId = parseBigIntParam(req.params.id)
        if (!campaignId) {
            return ApiResponse.error(
                res,
                'campaign id must be a positive integer',
                400,
                undefined,
                'APPROVAL_INVALID_ID'
            )
        }

        const body = String(req.body?.body ?? '').trim()
        const visibility = String(req.body?.visibility ?? 'INTERNAL').trim()
        const attachmentUrl = req.body?.attachment_url
            ? String(req.body.attachment_url)
            : null
        const moduleIdValue = req.body?.module_id
            ? parseBigIntParam(String(req.body.module_id))
            : null

        if (!body) {
            return ApiResponse.error(
                res,
                'Validation failed',
                422,
                {
                    details: [
                        {
                            field: 'body',
                            message: 'body is required',
                        },
                    ],
                },
                'APPROVAL_COMMENT_VALIDATION_FAILED'
            )
        }

        const campaign = await prismaClient.campaign.findFirst({
            where: { id: campaignId, deletedAt: null },
            select: { id: true },
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

        if (moduleIdValue) {
            const module = await prismaClient.campaignModule.findFirst({
                where: {
                    id: moduleIdValue,
                    campaignId: campaign.id,
                    deletedAt: null,
                },
                select: { id: true },
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
        }

        const comment = await prismaClient.campaignReview.create({
            data: {
                campaignId: campaign.id,
                moduleId: moduleIdValue,
                authorType: 'OPERATOR',
                authorId: BigInt(req.payload!.userId),
                body,
                visibility: visibility || 'INTERNAL',
                attachmentUrl,
            },
        })

        return ApiResponse.success(
            res,
            {
                id: toId(comment.id),
                campaign_id: toId(comment.campaignId),
                module_id: toId(comment.moduleId),
                body: comment.body,
                visibility: comment.visibility,
                attachment_url: comment.attachmentUrl,
                created_at: comment.createdAt,
            },
            'Approval comment created successfully',
            201
        )
    } catch (error) {
        next(error)
    }
})

const transitionCampaignStatus = async (input: {
    campaignId: bigint
    reqRoleUserId: bigint
    targetStatus: CampaignStatus
    allowedFrom: CampaignStatus[]
    actionCode: string
    reason?: string
    ipAddress?: string | null
}) => {
    const campaign = await prismaClient.campaign.findFirst({
        where: {
            id: input.campaignId,
            deletedAt: null,
        },
    })

    if (!campaign) {
        return {
            error: {
                statusCode: 404,
                code: 'CAMPAIGN_NOT_FOUND',
                message: 'Campaign not found',
            },
        } as const
    }

    if (!input.allowedFrom.includes(campaign.status)) {
        return {
            error: {
                statusCode: 409,
                code: 'CAMPAIGN_STATE_CONFLICT',
                message: 'State conflict',
                details: {
                    current_status: campaign.status,
                    allowed_statuses: input.allowedFrom,
                },
            },
        } as const
    }

    const updated = await prismaClient.$transaction(async (tx) => {
        const nextCampaign = await tx.campaign.update({
            where: { id: campaign.id },
            data: {
                status: input.targetStatus,
                ...(input.targetStatus === 'APPROVED' && {
                    approvedBy: input.reqRoleUserId,
                    approvedAt: new Date(),
                }),
            },
        })

        await tx.campaignReview.create({
            data: {
                campaignId: campaign.id,
                authorType: 'OPERATOR',
                authorId: input.reqRoleUserId,
                body: input.reason?.trim() || `${input.actionCode} by school reviewer`,
                visibility: 'INTERNAL',
            },
        })

        if (input.targetStatus === 'REVISION_REQUIRED') {
            await tx.campaignModule.updateMany({
                where: {
                    campaignId: campaign.id,
                    deletedAt: null,
                },
                data: {
                    status: 'DRAFT',
                },
            })
        }

        if (input.targetStatus === 'APPROVED') {
            await tx.campaignModule.updateMany({
                where: {
                    campaignId: campaign.id,
                    deletedAt: null,
                    status: 'READY_FOR_REVIEW',
                },
                data: {
                    status: 'APPROVED',
                },
            })
        }

        await createAuditLog({
            actorId: input.reqRoleUserId,
            action: input.actionCode,
            entityId: campaign.id,
            beforeStatus: campaign.status,
            afterStatus: input.targetStatus,
            reason: input.reason,
            ipAddress: input.ipAddress,
        })

        await notifyOrganizationOperators({
            organizationId: campaign.organizationId,
            type: `CAMPAIGN_${input.targetStatus}`,
            title: `Campaign status updated: ${input.targetStatus}`,
            body: `Campaign "${campaign.title}" changed to ${input.targetStatus}.`,
            data: {
                campaign_id: toId(campaign.id),
                from_status: campaign.status,
                to_status: input.targetStatus,
                reason: input.reason ?? null,
            },
        })

        return nextCampaign
    })

    return {
        campaign,
        updated,
    } as const
}

const handleTransition = (
    targetStatus: CampaignStatus,
    allowedFrom: CampaignStatus[],
    actionCode: string
) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.payload?.userId) {
            return ApiResponse.error(
                res,
                'Unauthorized',
                401,
                undefined,
                'UNAUTHORIZED'
            )
        }

        const campaignId = parseBigIntParam(req.params.id)
        if (!campaignId) {
            return ApiResponse.error(
                res,
                'campaign id must be a positive integer',
                400,
                undefined,
                'APPROVAL_INVALID_ID'
            )
        }

        const transition = await transitionCampaignStatus({
            campaignId,
            reqRoleUserId: BigInt(req.payload.userId),
            targetStatus,
            allowedFrom,
            actionCode,
            reason: req.body?.reason ? String(req.body.reason) : undefined,
            ipAddress: req.ip,
        })

        if ('error' in transition && transition.error) {
            return ApiResponse.error(
                res,
                transition.error.message,
                transition.error.statusCode,
                transition.error.details,
                transition.error.code
            )
        }

        return ApiResponse.success(
            res,
            {
                campaign_id: toId(transition.updated.id),
                from_status: transition.campaign.status,
                to_status: transition.updated.status,
                changed_by: req.payload.userId,
                reason: req.body?.reason ?? null,
            },
            `Campaign ${targetStatus.toLowerCase()} successfully`
        )
    } catch (error) {
        next(error)
    }
}

approvalsRouter.post(
    '/campaigns/:id/request-revision',
    handleTransition(
        'REVISION_REQUIRED',
        ['SUBMITTED', 'PRE_APPROVED'],
        'CAMPAIGN_REQUEST_REVISION'
    )
)

approvalsRouter.post(
    '/campaigns/:id/pre-approve',
    handleTransition(
        'PRE_APPROVED',
        ['SUBMITTED'],
        'CAMPAIGN_PRE_APPROVED'
    )
)

approvalsRouter.post(
    '/campaigns/:id/approve',
    handleTransition(
        'APPROVED',
        ['SUBMITTED', 'PRE_APPROVED'],
        'CAMPAIGN_APPROVED'
    )
)

approvalsRouter.post(
    '/campaigns/:id/reject',
    handleTransition(
        'REJECTED',
        ['SUBMITTED', 'PRE_APPROVED'],
        'CAMPAIGN_REJECTED'
    )
)

export default approvalsRouter
