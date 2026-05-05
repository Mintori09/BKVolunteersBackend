import { Router } from 'express'
import { Prisma } from '@prisma/client'
import type { ItemPledgeStatus, ItemTargetStatus } from '@prisma/client'
import { prismaClient } from 'src/config'
import {
    requireAccountType,
    requireAuth,
    requireRoles,
} from 'src/common/middleware'
import { ApiResponse } from 'src/utils/ApiResponse'

const itemDonationsRouter = Router()
const ITEM_PLEDGE_STATUSES: ItemPledgeStatus[] = [
    'PLEDGED',
    'CONFIRMED',
    'RECEIVED',
    'REJECTED',
    'CANCELLED',
]
const ITEM_TARGET_STATUSES: ItemTargetStatus[] = ['ACTIVE', 'CLOSED']
const ORG_ROLES = ['ORG_ADMIN', 'ORG_MEMBER'] as const

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

const createAuditLog = async (input: {
    actorId: bigint
    action: string
    entityType: string
    entityId: bigint
    beforeJson?: unknown
    afterJson?: unknown
    ipAddress?: string | null
}) => {
    await prismaClient.auditLog.create({
        data: {
            actorType: 'OPERATOR',
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

const notifyStudent = async (input: {
    studentId: bigint
    type: string
    title: string
    body: string
    data: Record<string, unknown>
}) => {
    await prismaClient.notification.create({
        data: {
            accountType: 'STUDENT',
            studentId: input.studentId,
            type: input.type,
            title: input.title,
            body: input.body,
            dataJson: toJsonInput(input.data),
        },
    })
}

const ensureOrgScopeForItemModule = async (
    moduleId: bigint,
    organizationId: string | null | undefined
) => {
    const module = await prismaClient.campaignModule.findFirst({
        where: {
            id: moduleId,
            deletedAt: null,
            type: 'item_donation',
        },
        include: {
            campaign: true,
        },
    })

    if (!module) {
        return {
            error: {
                statusCode: 404,
                code: 'ITEM_DONATION_MODULE_NOT_FOUND',
                message: 'Item donation module not found',
            },
        } as const
    }

    if (!organizationId || String(module.campaign.organizationId) !== String(organizationId)) {
        return {
            error: {
                statusCode: 403,
                code: 'FORBIDDEN_ORGANIZATION_SCOPE',
                message: 'You can only access modules in your organization',
            },
        } as const
    }

    return { module } as const
}

const ensureOrgScopeForPledge = async (
    pledgeId: bigint,
    organizationId: string | null | undefined
) => {
    const pledge = await prismaClient.itemPledge.findFirst({
        where: { id: pledgeId },
        include: {
            campaign: true,
            module: true,
            itemTarget: true,
        },
    })

    if (!pledge) {
        return {
            error: {
                statusCode: 404,
                code: 'ITEM_PLEDGE_NOT_FOUND',
                message: 'Item pledge not found',
            },
        } as const
    }

    if (!organizationId || String(pledge.campaign.organizationId) !== String(organizationId)) {
        return {
            error: {
                statusCode: 403,
                code: 'FORBIDDEN_ORGANIZATION_SCOPE',
                message: 'You can only access pledges in your organization',
            },
        } as const
    }

    return { pledge } as const
}

itemDonationsRouter.patch(
    '/modules/:moduleId/config',
    requireAuth,
    requireRoles([...ORG_ROLES]),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const moduleId = parseBigIntParam(req.params.moduleId)
            if (!moduleId) {
                return ApiResponse.error(
                    res,
                    'module id must be a positive integer',
                    400,
                    undefined,
                    'ITEM_DONATION_INVALID_MODULE_ID'
                )
            }

            const scopedModule = await ensureOrgScopeForItemModule(
                moduleId,
                req.payload?.organizationId
            )

            if ('error' in scopedModule && scopedModule.error) {
                return ApiResponse.error(
                    res,
                    scopedModule.error.message,
                    scopedModule.error.statusCode,
                    undefined,
                    scopedModule.error.code
                )
            }

            const receiverAddress = String(req.body?.receiver_address ?? '').trim()
            const receiverContact = String(req.body?.receiver_contact ?? '').trim()
            const allowOverTarget = Boolean(req.body?.allow_over_target)
            const handoverNote = req.body?.handover_note
                ? String(req.body.handover_note).trim()
                : null

            const details: Array<{ field: string; message: string }> = []
            if (!receiverAddress) {
                details.push({
                    field: 'receiver_address',
                    message: 'receiver_address is required',
                })
            }
            if (!receiverContact) {
                details.push({
                    field: 'receiver_contact',
                    message: 'receiver_contact is required',
                })
            }

            if (details.length > 0) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    { details },
                    'ITEM_DONATION_CONFIG_VALIDATION_FAILED'
                )
            }

            const currentConfig = toSettingsObject(scopedModule.module.settingsJson)
            const nextConfig = {
                ...currentConfig,
                receiver_address: receiverAddress,
                receiver_contact: receiverContact,
                allow_over_target: allowOverTarget,
                handover_note: handoverNote,
            }

            await prismaClient.campaignModule.update({
                where: { id: scopedModule.module.id },
                data: {
                    settingsJson: toJsonInput(nextConfig) as Prisma.InputJsonValue,
                },
            })

            return ApiResponse.success(
                res,
                {
                    module_id: toId(scopedModule.module.id),
                    config: nextConfig,
                },
                'Item donation config updated successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

itemDonationsRouter.post(
    '/modules/:moduleId/targets',
    requireAuth,
    requireRoles([...ORG_ROLES]),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const moduleId = parseBigIntParam(req.params.moduleId)
            if (!moduleId) {
                return ApiResponse.error(
                    res,
                    'module id must be a positive integer',
                    400,
                    undefined,
                    'ITEM_DONATION_INVALID_MODULE_ID'
                )
            }

            const scopedModule = await ensureOrgScopeForItemModule(
                moduleId,
                req.payload?.organizationId
            )

            if ('error' in scopedModule && scopedModule.error) {
                return ApiResponse.error(
                    res,
                    scopedModule.error.message,
                    scopedModule.error.statusCode,
                    undefined,
                    scopedModule.error.code
                )
            }

            const name = String(req.body?.name ?? '').trim()
            const unit = String(req.body?.unit ?? '').trim()
            const targetQuantity = Number(req.body?.target_quantity ?? 0)
            const description = req.body?.description
                ? String(req.body.description).trim()
                : null

            const details: Array<{ field: string; message: string }> = []
            if (!name) {
                details.push({ field: 'name', message: 'name is required' })
            }
            if (!unit) {
                details.push({ field: 'unit', message: 'unit is required' })
            }
            if (!Number.isFinite(targetQuantity) || targetQuantity <= 0) {
                details.push({
                    field: 'target_quantity',
                    message: 'target_quantity must be greater than 0',
                })
            }

            if (details.length > 0) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    { details },
                    'ITEM_TARGET_VALIDATION_FAILED'
                )
            }

            const target = await prismaClient.itemTarget.create({
                data: {
                    campaignId: scopedModule.module.campaignId,
                    moduleId: scopedModule.module.id,
                    name,
                    unit,
                    targetQuantity,
                    description,
                    status: 'ACTIVE',
                },
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(target.id),
                    campaign_id: toId(target.campaignId),
                    module_id: toId(target.moduleId),
                    name: target.name,
                    unit: target.unit,
                    target_quantity: target.targetQuantity,
                    received_quantity: target.receivedQuantity,
                    status: target.status,
                },
                'Item target created successfully',
                201
            )
        } catch (error) {
            next(error)
        }
    }
)

itemDonationsRouter.get('/modules/:moduleId/targets', async (req, res, next) => {
    try {
        const moduleId = parseBigIntParam(req.params.moduleId)
        if (!moduleId) {
            return ApiResponse.error(
                res,
                'module id must be a positive integer',
                400,
                undefined,
                'ITEM_DONATION_INVALID_MODULE_ID'
            )
        }

        const module = await prismaClient.campaignModule.findFirst({
            where: {
                id: moduleId,
                deletedAt: null,
                type: 'item_donation',
            },
            select: {
                id: true,
            },
        })

        if (!module) {
            return ApiResponse.error(
                res,
                'Item donation module not found',
                404,
                undefined,
                'ITEM_DONATION_MODULE_NOT_FOUND'
            )
        }

        const status = String(req.query.status ?? '').trim().toUpperCase()
        if (status && !ITEM_TARGET_STATUSES.includes(status as ItemTargetStatus)) {
            return ApiResponse.error(
                res,
                'status must be ACTIVE or CLOSED',
                400,
                { status },
                'ITEM_TARGET_INVALID_FILTER'
            )
        }

        const targets = await prismaClient.itemTarget.findMany({
            where: {
                moduleId: module.id,
                ...(status && { status: status as ItemTargetStatus }),
            },
            orderBy: [{ createdAt: 'asc' }],
        })

        return ApiResponse.success(
            res,
            targets.map((target) => ({
                id: toId(target.id),
                module_id: toId(target.moduleId),
                campaign_id: toId(target.campaignId),
                name: target.name,
                unit: target.unit,
                target_quantity: target.targetQuantity,
                received_quantity: target.receivedQuantity,
                description: target.description,
                status: target.status,
                remaining_quantity: Math.max(0, target.targetQuantity - target.receivedQuantity),
            })),
            'Item targets fetched successfully'
        )
    } catch (error) {
        next(error)
    }
})

itemDonationsRouter.patch(
    '/targets/:targetId',
    requireAuth,
    requireRoles([...ORG_ROLES]),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const targetId = parseBigIntParam(req.params.targetId)
            if (!targetId) {
                return ApiResponse.error(
                    res,
                    'target id must be a positive integer',
                    400,
                    undefined,
                    'ITEM_TARGET_INVALID_ID'
                )
            }

            const target = await prismaClient.itemTarget.findFirst({
                where: { id: targetId },
                include: { campaign: true },
            })

            if (!target) {
                return ApiResponse.error(
                    res,
                    'Item target not found',
                    404,
                    undefined,
                    'ITEM_TARGET_NOT_FOUND'
                )
            }

            if (String(target.campaign.organizationId) !== String(req.payload?.organizationId)) {
                return ApiResponse.error(
                    res,
                    'You can only edit targets in your organization',
                    403,
                    undefined,
                    'FORBIDDEN_ORGANIZATION_SCOPE'
                )
            }

            const nextName =
                req.body?.name !== undefined ? String(req.body.name).trim() : target.name
            const nextUnit =
                req.body?.unit !== undefined ? String(req.body.unit).trim() : target.unit
            const nextTargetQuantity =
                req.body?.target_quantity !== undefined
                    ? Number(req.body.target_quantity)
                    : target.targetQuantity
            const nextDescription =
                req.body?.description !== undefined
                    ? req.body.description
                        ? String(req.body.description).trim()
                        : null
                    : target.description
            const nextStatus =
                req.body?.status !== undefined
                    ? String(req.body.status).trim().toUpperCase()
                    : target.status

            const details: Array<{ field: string; message: string }> = []
            if (!nextName) {
                details.push({ field: 'name', message: 'name is required' })
            }
            if (!nextUnit) {
                details.push({ field: 'unit', message: 'unit is required' })
            }
            if (!Number.isFinite(nextTargetQuantity) || nextTargetQuantity <= 0) {
                details.push({
                    field: 'target_quantity',
                    message: 'target_quantity must be greater than 0',
                })
            }
            if (nextTargetQuantity < target.receivedQuantity) {
                details.push({
                    field: 'target_quantity',
                    message: 'target_quantity cannot be smaller than received_quantity',
                })
            }
            if (!ITEM_TARGET_STATUSES.includes(nextStatus as ItemTargetStatus)) {
                details.push({
                    field: 'status',
                    message: 'status must be ACTIVE or CLOSED',
                })
            }

            if (details.length > 0) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    { details },
                    'ITEM_TARGET_VALIDATION_FAILED'
                )
            }

            const updated = await prismaClient.itemTarget.update({
                where: { id: target.id },
                data: {
                    name: nextName,
                    unit: nextUnit,
                    targetQuantity: nextTargetQuantity,
                    description: nextDescription,
                    status: nextStatus as ItemTargetStatus,
                },
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(updated.id),
                    name: updated.name,
                    unit: updated.unit,
                    target_quantity: updated.targetQuantity,
                    received_quantity: updated.receivedQuantity,
                    status: updated.status,
                },
                'Item target updated successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

itemDonationsRouter.post(
    '/modules/:moduleId/pledges',
    requireAuth,
    requireAccountType('STUDENT'),
    async (req, res, next) => {
        try {
            const moduleId = parseBigIntParam(req.params.moduleId)
            if (!moduleId) {
                return ApiResponse.error(
                    res,
                    'module id must be a positive integer',
                    400,
                    undefined,
                    'ITEM_DONATION_INVALID_MODULE_ID'
                )
            }

            const module = await prismaClient.campaignModule.findFirst({
                where: {
                    id: moduleId,
                    deletedAt: null,
                    type: 'item_donation',
                },
                include: { campaign: true },
            })

            if (!module) {
                return ApiResponse.error(
                    res,
                    'Item donation module not found',
                    404,
                    undefined,
                    'ITEM_DONATION_MODULE_NOT_FOUND'
                )
            }

            if (module.status !== 'OPEN') {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    { current_status: module.status, allowed_statuses: ['OPEN'] },
                    'ITEM_DONATION_MODULE_CLOSED'
                )
            }

            const itemTargetId = parseBigIntParam(req.body?.item_target_id)
            const quantity = Number(req.body?.quantity ?? 0)
            const donorName = String(req.body?.donor_name ?? '').trim()
            const expectedHandoverAt = req.body?.expected_handover_at
                ? parseDateInput(String(req.body.expected_handover_at))
                : null
            const note = req.body?.note ? String(req.body.note).trim() : null

            const details: Array<{ field: string; message: string }> = []
            if (!itemTargetId) {
                details.push({
                    field: 'item_target_id',
                    message: 'item_target_id is required',
                })
            }
            if (!Number.isFinite(quantity) || quantity <= 0) {
                details.push({
                    field: 'quantity',
                    message: 'quantity must be greater than 0',
                })
            }
            if (!donorName) {
                details.push({
                    field: 'donor_name',
                    message: 'donor_name is required',
                })
            }
            if (req.body?.expected_handover_at && !expectedHandoverAt) {
                details.push({
                    field: 'expected_handover_at',
                    message: 'expected_handover_at must be a valid datetime',
                })
            }

            if (details.length > 0) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    { details },
                    'ITEM_PLEDGE_VALIDATION_FAILED'
                )
            }

            const itemTarget = await prismaClient.itemTarget.findFirst({
                where: {
                    id: itemTargetId!,
                    moduleId: module.id,
                },
                select: {
                    id: true,
                    targetQuantity: true,
                    receivedQuantity: true,
                    status: true,
                },
            })

            if (!itemTarget) {
                return ApiResponse.error(
                    res,
                    'Item target not found',
                    404,
                    undefined,
                    'ITEM_TARGET_NOT_FOUND'
                )
            }

            if (itemTarget.status !== 'ACTIVE') {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    {
                        current_status: itemTarget.status,
                        allowed_statuses: ['ACTIVE'],
                    },
                    'ITEM_TARGET_CLOSED'
                )
            }

            const settings = toSettingsObject(module.settingsJson)
            const allowOverTarget = Boolean(settings.allow_over_target)
            if (!allowOverTarget) {
                const reserved = await prismaClient.itemPledge.aggregate({
                    where: {
                        itemTargetId: itemTarget.id,
                        status: { in: ['PLEDGED', 'CONFIRMED'] },
                    },
                    _sum: { quantity: true },
                })
                const currentReserved = toNumber(reserved._sum.quantity)
                const totalAfter = itemTarget.receivedQuantity + currentReserved + quantity
                if (totalAfter > itemTarget.targetQuantity) {
                    return ApiResponse.error(
                        res,
                        'State conflict',
                        409,
                        {
                            item_target_id: toId(itemTarget.id),
                            target_quantity: itemTarget.targetQuantity,
                            received_quantity: itemTarget.receivedQuantity,
                            reserved_quantity: currentReserved,
                            requested_quantity: quantity,
                        },
                        'ITEM_PLEDGE_OVER_TARGET'
                    )
                }
            }

            const pledge = await prismaClient.itemPledge.create({
                data: {
                    campaignId: module.campaignId,
                    moduleId: module.id,
                    itemTargetId: itemTarget.id,
                    studentId: BigInt(req.payload!.userId),
                    donorName,
                    quantity,
                    expectedHandoverAt,
                    note,
                    status: 'PLEDGED',
                },
            })

            await notifyOrganizationOperators({
                organizationId: module.campaign.organizationId,
                type: 'ITEM_PLEDGE_CREATED',
                title: 'Có đăng ký hiện vật mới',
                body: `Sinh viên vừa tạo đăng ký hiện vật #${toId(pledge.id)}.`,
                data: {
                    campaign_id: toId(pledge.campaignId),
                    module_id: toId(pledge.moduleId),
                    pledge_id: toId(pledge.id),
                },
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(pledge.id),
                    campaign_id: toId(pledge.campaignId),
                    module_id: toId(pledge.moduleId),
                    item_target_id: toId(pledge.itemTargetId),
                    student_id: toId(pledge.studentId),
                    quantity: pledge.quantity,
                    donor_name: pledge.donorName,
                    status: pledge.status,
                    expected_handover_at: pledge.expectedHandoverAt,
                    note: pledge.note,
                },
                'Item pledge created successfully',
                201
            )
        } catch (error) {
            next(error)
        }
    }
)

itemDonationsRouter.get(
    '/modules/:moduleId/pledges',
    requireAuth,
    requireRoles([...ORG_ROLES]),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const moduleId = parseBigIntParam(req.params.moduleId)
            if (!moduleId) {
                return ApiResponse.error(
                    res,
                    'module id must be a positive integer',
                    400,
                    undefined,
                    'ITEM_DONATION_INVALID_MODULE_ID'
                )
            }

            const scopedModule = await ensureOrgScopeForItemModule(
                moduleId,
                req.payload?.organizationId
            )
            if ('error' in scopedModule && scopedModule.error) {
                return ApiResponse.error(
                    res,
                    scopedModule.error.message,
                    scopedModule.error.statusCode,
                    undefined,
                    scopedModule.error.code
                )
            }

            const page = getPositiveIntQuery(req.query.page, 1)
            const limit = getPositiveIntQuery(req.query.limit, 10, 100)
            const q = String(req.query.q ?? '').trim()
            const status = String(req.query.status ?? '').trim().toUpperCase()

            if (status && !ITEM_PLEDGE_STATUSES.includes(status as ItemPledgeStatus)) {
                return ApiResponse.error(
                    res,
                    'status must be one of PLEDGED, CONFIRMED, RECEIVED, REJECTED or CANCELLED',
                    400,
                    { status },
                    'ITEM_PLEDGE_INVALID_FILTER'
                )
            }

            const where = {
                moduleId: scopedModule.module.id,
                ...(status && { status: status as ItemPledgeStatus }),
                ...(q && {
                    OR: [
                        { donorName: { contains: q } },
                        { note: { contains: q } },
                        { itemTarget: { name: { contains: q } } },
                        { student: { fullName: { contains: q } } },
                        { student: { studentCode: { contains: q } } },
                    ],
                }),
            }

            const [total, pledges] = await Promise.all([
                prismaClient.itemPledge.count({ where }),
                prismaClient.itemPledge.findMany({
                    where,
                    include: {
                        itemTarget: true,
                        student: {
                            select: {
                                fullName: true,
                                studentCode: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
            ])

            return ApiResponse.success(
                res,
                pledges.map((pledge) => ({
                    id: toId(pledge.id),
                    module_id: toId(pledge.moduleId),
                    campaign_id: toId(pledge.campaignId),
                    item_target: {
                        id: toId(pledge.itemTarget.id),
                        name: pledge.itemTarget.name,
                        unit: pledge.itemTarget.unit,
                    },
                    student: {
                        id: toId(pledge.studentId),
                        full_name: pledge.student.fullName,
                        student_code: pledge.student.studentCode,
                    },
                    donor_name: pledge.donorName,
                    quantity: pledge.quantity,
                    status: pledge.status,
                    note: pledge.note,
                    expected_handover_at: pledge.expectedHandoverAt,
                    received_quantity: pledge.receivedQuantity,
                    received_at: pledge.receivedAt,
                    created_at: pledge.createdAt,
                })),
                'Item pledges fetched successfully',
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

itemDonationsRouter.patch(
    '/pledges/:id/confirm',
    requireAuth,
    requireRoles([...ORG_ROLES]),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const pledgeId = parseBigIntParam(req.params.id)
            if (!pledgeId) {
                return ApiResponse.error(
                    res,
                    'pledge id must be a positive integer',
                    400,
                    undefined,
                    'ITEM_PLEDGE_INVALID_ID'
                )
            }

            const scopedPledge = await ensureOrgScopeForPledge(
                pledgeId,
                req.payload?.organizationId
            )
            if ('error' in scopedPledge && scopedPledge.error) {
                return ApiResponse.error(
                    res,
                    scopedPledge.error.message,
                    scopedPledge.error.statusCode,
                    undefined,
                    scopedPledge.error.code
                )
            }

            if (scopedPledge.pledge.status !== 'PLEDGED') {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    {
                        current_status: scopedPledge.pledge.status,
                        allowed_statuses: ['PLEDGED'],
                    },
                    'ITEM_PLEDGE_STATE_CONFLICT'
                )
            }

            const confirmed = await prismaClient.itemPledge.update({
                where: { id: scopedPledge.pledge.id },
                data: {
                    status: 'CONFIRMED',
                },
            })

            await notifyStudent({
                studentId: confirmed.studentId,
                type: 'ITEM_PLEDGE_CONFIRMED',
                title: 'Đăng ký hiện vật đã được xác nhận',
                body: `Đăng ký hiện vật #${toId(confirmed.id)} đã được đơn vị xác nhận.`,
                data: {
                    campaign_id: toId(confirmed.campaignId),
                    module_id: toId(confirmed.moduleId),
                    pledge_id: toId(confirmed.id),
                },
            })

            await createAuditLog({
                actorId: BigInt(req.payload!.userId),
                action: 'ITEM_PLEDGE_CONFIRMED',
                entityType: 'item_pledge',
                entityId: confirmed.id,
                beforeJson: {
                    status: scopedPledge.pledge.status,
                },
                afterJson: {
                    status: confirmed.status,
                },
                ipAddress: req.ip,
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(confirmed.id),
                    status: confirmed.status,
                },
                'Item pledge confirmed successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

itemDonationsRouter.patch(
    '/pledges/:id/reject',
    requireAuth,
    requireRoles([...ORG_ROLES]),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const pledgeId = parseBigIntParam(req.params.id)
            if (!pledgeId) {
                return ApiResponse.error(
                    res,
                    'pledge id must be a positive integer',
                    400,
                    undefined,
                    'ITEM_PLEDGE_INVALID_ID'
                )
            }

            const scopedPledge = await ensureOrgScopeForPledge(
                pledgeId,
                req.payload?.organizationId
            )
            if ('error' in scopedPledge && scopedPledge.error) {
                return ApiResponse.error(
                    res,
                    scopedPledge.error.message,
                    scopedPledge.error.statusCode,
                    undefined,
                    scopedPledge.error.code
                )
            }

            if (scopedPledge.pledge.status !== 'PLEDGED') {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    {
                        current_status: scopedPledge.pledge.status,
                        allowed_statuses: ['PLEDGED'],
                    },
                    'ITEM_PLEDGE_STATE_CONFLICT'
                )
            }

            const reason = String(req.body?.reason ?? '').trim()
            if (!reason) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    {
                        details: [
                            {
                                field: 'reason',
                                message: 'reason is required',
                            },
                        ],
                    },
                    'ITEM_PLEDGE_REJECT_REASON_REQUIRED'
                )
            }

            const rejected = await prismaClient.itemPledge.update({
                where: { id: scopedPledge.pledge.id },
                data: {
                    status: 'REJECTED',
                    note: reason,
                },
            })

            await notifyStudent({
                studentId: rejected.studentId,
                type: 'ITEM_PLEDGE_REJECTED',
                title: 'Đăng ký hiện vật bị từ chối',
                body: `Đăng ký hiện vật #${toId(rejected.id)} đã bị từ chối.`,
                data: {
                    campaign_id: toId(rejected.campaignId),
                    module_id: toId(rejected.moduleId),
                    pledge_id: toId(rejected.id),
                    reason,
                },
            })

            await createAuditLog({
                actorId: BigInt(req.payload!.userId),
                action: 'ITEM_PLEDGE_REJECTED',
                entityType: 'item_pledge',
                entityId: rejected.id,
                beforeJson: {
                    status: scopedPledge.pledge.status,
                },
                afterJson: {
                    status: rejected.status,
                    reason,
                },
                ipAddress: req.ip,
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(rejected.id),
                    status: rejected.status,
                    reason,
                },
                'Item pledge rejected successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

itemDonationsRouter.post(
    '/pledges/:id/handover',
    requireAuth,
    requireRoles([...ORG_ROLES]),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const pledgeId = parseBigIntParam(req.params.id)
            if (!pledgeId) {
                return ApiResponse.error(
                    res,
                    'pledge id must be a positive integer',
                    400,
                    undefined,
                    'ITEM_PLEDGE_INVALID_ID'
                )
            }

            const scopedPledge = await ensureOrgScopeForPledge(
                pledgeId,
                req.payload?.organizationId
            )
            if ('error' in scopedPledge && scopedPledge.error) {
                return ApiResponse.error(
                    res,
                    scopedPledge.error.message,
                    scopedPledge.error.statusCode,
                    undefined,
                    scopedPledge.error.code
                )
            }

            if (scopedPledge.pledge.status !== 'CONFIRMED') {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    {
                        current_status: scopedPledge.pledge.status,
                        allowed_statuses: ['CONFIRMED'],
                    },
                    'ITEM_PLEDGE_STATE_CONFLICT'
                )
            }

            const quantity = Number(req.body?.received_quantity ?? 0)
            const receivedAt = req.body?.received_at
                ? parseDateInput(String(req.body.received_at))
                : new Date()
            const evidenceUrl = req.body?.evidence_url
                ? String(req.body.evidence_url).trim()
                : null
            const note = req.body?.note ? String(req.body.note).trim() : null
            const location = req.body?.location ? String(req.body.location).trim() : null

            const details: Array<{ field: string; message: string }> = []
            if (!Number.isFinite(quantity) || quantity <= 0) {
                details.push({
                    field: 'received_quantity',
                    message: 'received_quantity must be greater than 0',
                })
            }
            if (req.body?.received_at && !receivedAt) {
                details.push({
                    field: 'received_at',
                    message: 'received_at must be a valid datetime',
                })
            }

            if (details.length > 0) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    { details },
                    'ITEM_HANDOVER_VALIDATION_FAILED'
                )
            }

            const settings = toSettingsObject(scopedPledge.pledge.module.settingsJson)
            const allowOverTarget = Boolean(settings.allow_over_target)
            if (!allowOverTarget) {
                const nextReceived = scopedPledge.pledge.itemTarget.receivedQuantity + quantity
                if (nextReceived > scopedPledge.pledge.itemTarget.targetQuantity) {
                    return ApiResponse.error(
                        res,
                        'State conflict',
                        409,
                        {
                            item_target_id: toId(scopedPledge.pledge.itemTargetId),
                            target_quantity: scopedPledge.pledge.itemTarget.targetQuantity,
                            received_quantity: scopedPledge.pledge.itemTarget.receivedQuantity,
                            handover_quantity: quantity,
                        },
                        'ITEM_HANDOVER_OVER_TARGET'
                    )
                }
            }

            const [handoverRecord, updatedPledge] = await prismaClient.$transaction([
                prismaClient.itemHandoverRecord.create({
                    data: {
                        campaignId: scopedPledge.pledge.campaignId,
                        moduleId: scopedPledge.pledge.moduleId,
                        itemPledgeId: scopedPledge.pledge.id,
                        itemTargetId: scopedPledge.pledge.itemTargetId,
                        quantity,
                        receivedBy: BigInt(req.payload!.userId),
                        receivedAt: receivedAt ?? new Date(),
                        location,
                        note,
                        evidenceUrl,
                    },
                }),
                prismaClient.itemPledge.update({
                    where: { id: scopedPledge.pledge.id },
                    data: {
                        status: 'RECEIVED',
                        receivedQuantity: quantity,
                        receivedAt: receivedAt ?? new Date(),
                        note: note ?? scopedPledge.pledge.note,
                        evidenceUrl,
                    },
                }),
                prismaClient.itemTarget.update({
                    where: { id: scopedPledge.pledge.itemTargetId },
                    data: {
                        receivedQuantity: {
                            increment: quantity,
                        },
                    },
                }),
            ])

            await notifyStudent({
                studentId: updatedPledge.studentId,
                type: 'ITEM_PLEDGE_RECEIVED',
                title: 'Hiện vật đã được tiếp nhận',
                body: `Đơn vị đã ghi nhận bàn giao hiện vật cho đăng ký #${toId(updatedPledge.id)}.`,
                data: {
                    campaign_id: toId(updatedPledge.campaignId),
                    module_id: toId(updatedPledge.moduleId),
                    pledge_id: toId(updatedPledge.id),
                    handover_id: toId(handoverRecord.id),
                },
            })

            await createAuditLog({
                actorId: BigInt(req.payload!.userId),
                action: 'ITEM_HANDOVER_RECORDED',
                entityType: 'item_pledge',
                entityId: updatedPledge.id,
                beforeJson: {
                    status: scopedPledge.pledge.status,
                },
                afterJson: {
                    status: updatedPledge.status,
                    handover_id: toId(handoverRecord.id),
                    quantity,
                },
                ipAddress: req.ip,
            })

            return ApiResponse.success(
                res,
                {
                    pledge_id: toId(updatedPledge.id),
                    handover_id: toId(handoverRecord.id),
                    status: updatedPledge.status,
                    received_quantity: updatedPledge.receivedQuantity,
                    received_at: updatedPledge.receivedAt,
                },
                'Item handover recorded successfully',
                201
            )
        } catch (error) {
            next(error)
        }
    }
)

export default itemDonationsRouter
