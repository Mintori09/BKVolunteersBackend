import { Router } from 'express'
import { Prisma } from '@prisma/client'
import type { EventRegistrationStatus } from '@prisma/client'
import { prismaClient } from 'src/config'
import {
    requireAccountType,
    requireAuth,
    requireRoles,
} from 'src/common/middleware'
import { ApiResponse } from 'src/utils/ApiResponse'

const eventsRouter = Router()
const ORG_ROLES = ['ORG_ADMIN', 'ORG_MEMBER'] as const
const REGISTRATION_STATUSES: EventRegistrationStatus[] = [
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED',
    'CHECKED_IN',
    'COMPLETED',
]

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

const countReservedQuota = async (moduleId: bigint) =>
    prismaClient.eventRegistration.count({
        where: {
            moduleId,
            status: {
                in: ['PENDING', 'APPROVED', 'CHECKED_IN', 'COMPLETED'],
            },
        },
    })

const ensureOrgScopeForEventModule = async (
    moduleId: bigint,
    organizationId: string | null | undefined
) => {
    const module = await prismaClient.campaignModule.findFirst({
        where: {
            id: moduleId,
            deletedAt: null,
            type: 'event',
        },
        include: { campaign: true },
    })

    if (!module) {
        return {
            error: {
                statusCode: 404,
                code: 'EVENT_MODULE_NOT_FOUND',
                message: 'Event module not found',
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

const ensureOrgScopeForRegistration = async (
    registrationId: bigint,
    organizationId: string | null | undefined
) => {
    const registration = await prismaClient.eventRegistration.findFirst({
        where: { id: registrationId },
        include: {
            campaign: true,
            module: true,
            student: {
                select: {
                    id: true,
                    fullName: true,
                    studentCode: true,
                },
            },
        },
    })

    if (!registration) {
        return {
            error: {
                statusCode: 404,
                code: 'EVENT_REGISTRATION_NOT_FOUND',
                message: 'Event registration not found',
            },
        } as const
    }

    if (
        !organizationId ||
        String(registration.campaign.organizationId) !== String(organizationId)
    ) {
        return {
            error: {
                statusCode: 403,
                code: 'FORBIDDEN_ORGANIZATION_SCOPE',
                message: 'You can only access registrations in your organization',
            },
        } as const
    }

    return { registration } as const
}

eventsRouter.patch(
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
                    'EVENT_INVALID_MODULE_ID'
                )
            }

            const scopedModule = await ensureOrgScopeForEventModule(
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

            const location = String(req.body?.location ?? '').trim()
            const quota = Number(req.body?.quota ?? 0)
            const registrationRequired =
                req.body?.registration_required === undefined
                    ? true
                    : Boolean(req.body.registration_required)
            const checkinRequired =
                req.body?.checkin_required === undefined
                    ? true
                    : Boolean(req.body.checkin_required)
            const benefitsRaw = req.body?.benefits
            const benefits = Array.isArray(benefitsRaw)
                ? benefitsRaw.map((item) => String(item).trim()).filter(Boolean)
                : []

            const details: Array<{ field: string; message: string }> = []
            if (!location) {
                details.push({ field: 'location', message: 'location is required' })
            }
            if (!Number.isFinite(quota) || quota <= 0) {
                details.push({ field: 'quota', message: 'quota must be greater than 0' })
            }

            if (details.length > 0) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    { details },
                    'EVENT_CONFIG_VALIDATION_FAILED'
                )
            }

            const currentConfig = toSettingsObject(scopedModule.module.settingsJson)
            const nextConfig = {
                ...currentConfig,
                location,
                quota,
                registration_required: registrationRequired,
                checkin_required: checkinRequired,
                benefits,
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
                'Event config updated successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

eventsRouter.post(
    '/modules/:moduleId/registrations',
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
                    'EVENT_INVALID_MODULE_ID'
                )
            }

            const module = await prismaClient.campaignModule.findFirst({
                where: {
                    id: moduleId,
                    deletedAt: null,
                    type: 'event',
                },
                include: { campaign: true },
            })

            if (!module) {
                return ApiResponse.error(
                    res,
                    'Event module not found',
                    404,
                    undefined,
                    'EVENT_MODULE_NOT_FOUND'
                )
            }

            if (module.status !== 'OPEN') {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    { current_status: module.status, allowed_statuses: ['OPEN'] },
                    'EVENT_MODULE_CLOSED'
                )
            }

            const existed = await prismaClient.eventRegistration.findFirst({
                where: {
                    moduleId: module.id,
                    studentId: BigInt(req.payload!.userId),
                },
                select: {
                    id: true,
                    status: true,
                },
            })
            if (existed) {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    {
                        registration_id: toId(existed.id),
                        current_status: existed.status,
                    },
                    'EVENT_REGISTRATION_DUPLICATE'
                )
            }

            const settings = toSettingsObject(module.settingsJson)
            const quota = toNumber(settings.quota)
            if (quota > 0) {
                const reserved = await countReservedQuota(module.id)
                if (reserved >= quota) {
                    return ApiResponse.error(
                        res,
                        'State conflict',
                        409,
                        { quota, reserved },
                        'EVENT_QUOTA_REACHED'
                    )
                }
            }

            const status: EventRegistrationStatus =
                settings.registration_required === false ? 'APPROVED' : 'PENDING'

            const registration = await prismaClient.eventRegistration.create({
                data: {
                    campaignId: module.campaignId,
                    moduleId: module.id,
                    studentId: BigInt(req.payload!.userId),
                    status,
                    answersJson:
                        req.body?.answers && typeof req.body.answers === 'object'
                            ? (req.body.answers as Prisma.InputJsonValue)
                            : ({} as Prisma.InputJsonValue),
                },
            })

            await notifyOrganizationOperators({
                organizationId: module.campaign.organizationId,
                type: 'EVENT_REGISTRATION_CREATED',
                title: 'Có đăng ký sự kiện mới',
                body: `Sinh viên vừa đăng ký sự kiện #${toId(registration.id)}.`,
                data: {
                    campaign_id: toId(registration.campaignId),
                    module_id: toId(registration.moduleId),
                    registration_id: toId(registration.id),
                    status: registration.status,
                },
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(registration.id),
                    campaign_id: toId(registration.campaignId),
                    module_id: toId(registration.moduleId),
                    status: registration.status,
                    registered_at: registration.registeredAt,
                },
                'Event registration created successfully',
                201
            )
        } catch (error) {
            next(error)
        }
    }
)

eventsRouter.get(
    '/modules/:moduleId/registrations',
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
                    'EVENT_INVALID_MODULE_ID'
                )
            }

            const scopedModule = await ensureOrgScopeForEventModule(
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

            if (status && !REGISTRATION_STATUSES.includes(status as EventRegistrationStatus)) {
                return ApiResponse.error(
                    res,
                    'status must be one of PENDING, APPROVED, REJECTED, CANCELLED, CHECKED_IN or COMPLETED',
                    400,
                    { status },
                    'EVENT_REGISTRATION_INVALID_FILTER'
                )
            }

            const where = {
                moduleId: scopedModule.module.id,
                ...(status && { status: status as EventRegistrationStatus }),
                ...(q && {
                    OR: [
                        { student: { fullName: { contains: q } } },
                        { student: { studentCode: { contains: q } } },
                        { reviewNote: { contains: q } },
                    ],
                }),
            }

            const [total, registrations] = await Promise.all([
                prismaClient.eventRegistration.count({ where }),
                prismaClient.eventRegistration.findMany({
                    where,
                    include: {
                        student: {
                            select: {
                                fullName: true,
                                studentCode: true,
                                email: true,
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
                registrations.map((registration) => ({
                    id: toId(registration.id),
                    campaign_id: toId(registration.campaignId),
                    module_id: toId(registration.moduleId),
                    student: {
                        id: toId(registration.studentId),
                        full_name: registration.student.fullName,
                        student_code: registration.student.studentCode,
                        email: registration.student.email,
                    },
                    status: registration.status,
                    answers: registration.answersJson,
                    registered_at: registration.registeredAt,
                    reviewed_at: registration.reviewedAt,
                    review_note: registration.reviewNote,
                    checked_in_at: registration.checkedInAt,
                    checked_out_at: registration.checkedOutAt,
                    hours: toNumber(registration.hours),
                })),
                'Event registrations fetched successfully',
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

eventsRouter.patch(
    '/registrations/:id/approve',
    requireAuth,
    requireRoles([...ORG_ROLES]),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const registrationId = parseBigIntParam(req.params.id)
            if (!registrationId) {
                return ApiResponse.error(
                    res,
                    'registration id must be a positive integer',
                    400,
                    undefined,
                    'EVENT_REGISTRATION_INVALID_ID'
                )
            }

            const scopedRegistration = await ensureOrgScopeForRegistration(
                registrationId,
                req.payload?.organizationId
            )
            if ('error' in scopedRegistration && scopedRegistration.error) {
                return ApiResponse.error(
                    res,
                    scopedRegistration.error.message,
                    scopedRegistration.error.statusCode,
                    undefined,
                    scopedRegistration.error.code
                )
            }

            const currentStatus = scopedRegistration.registration.status
            if (currentStatus !== 'PENDING') {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    { current_status: currentStatus, allowed_statuses: ['PENDING'] },
                    'EVENT_REGISTRATION_STATE_CONFLICT'
                )
            }

            const settings = toSettingsObject(scopedRegistration.registration.module.settingsJson)
            const quota = toNumber(settings.quota)
            if (quota > 0) {
                const activeCount = await prismaClient.eventRegistration.count({
                    where: {
                        moduleId: scopedRegistration.registration.moduleId,
                        status: { in: ['APPROVED', 'CHECKED_IN', 'COMPLETED'] },
                    },
                })

                if (activeCount >= quota) {
                    return ApiResponse.error(
                        res,
                        'State conflict',
                        409,
                        { quota, active_count: activeCount },
                        'EVENT_QUOTA_REACHED'
                    )
                }
            }

            const reviewNote = req.body?.review_note
                ? String(req.body.review_note).trim()
                : null
            const approved = await prismaClient.eventRegistration.update({
                where: { id: scopedRegistration.registration.id },
                data: {
                    status: 'APPROVED',
                    reviewedBy: BigInt(req.payload!.userId),
                    reviewedAt: new Date(),
                    reviewNote,
                },
            })

            await notifyStudent({
                studentId: approved.studentId,
                type: 'EVENT_REGISTRATION_APPROVED',
                title: 'Đăng ký sự kiện đã được duyệt',
                body: `Đăng ký sự kiện #${toId(approved.id)} đã được duyệt.`,
                data: {
                    campaign_id: toId(approved.campaignId),
                    module_id: toId(approved.moduleId),
                    registration_id: toId(approved.id),
                },
            })

            await createAuditLog({
                actorId: BigInt(req.payload!.userId),
                action: 'EVENT_REGISTRATION_APPROVED',
                entityType: 'event_registration',
                entityId: approved.id,
                beforeJson: { status: currentStatus },
                afterJson: { status: approved.status, review_note: reviewNote },
                ipAddress: req.ip,
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(approved.id),
                    status: approved.status,
                    reviewed_at: approved.reviewedAt,
                    reviewed_by: toId(approved.reviewedBy),
                    review_note: approved.reviewNote,
                },
                'Event registration approved successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

eventsRouter.patch(
    '/registrations/:id/reject',
    requireAuth,
    requireRoles([...ORG_ROLES]),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const registrationId = parseBigIntParam(req.params.id)
            if (!registrationId) {
                return ApiResponse.error(
                    res,
                    'registration id must be a positive integer',
                    400,
                    undefined,
                    'EVENT_REGISTRATION_INVALID_ID'
                )
            }

            const scopedRegistration = await ensureOrgScopeForRegistration(
                registrationId,
                req.payload?.organizationId
            )
            if ('error' in scopedRegistration && scopedRegistration.error) {
                return ApiResponse.error(
                    res,
                    scopedRegistration.error.message,
                    scopedRegistration.error.statusCode,
                    undefined,
                    scopedRegistration.error.code
                )
            }

            const currentStatus = scopedRegistration.registration.status
            if (!['PENDING', 'APPROVED'].includes(currentStatus)) {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    {
                        current_status: currentStatus,
                        allowed_statuses: ['PENDING', 'APPROVED'],
                    },
                    'EVENT_REGISTRATION_STATE_CONFLICT'
                )
            }

            const reviewNote = String(req.body?.review_note ?? '').trim()
            if (!reviewNote) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    {
                        details: [
                            {
                                field: 'review_note',
                                message: 'review_note is required',
                            },
                        ],
                    },
                    'EVENT_REJECT_NOTE_REQUIRED'
                )
            }

            const rejected = await prismaClient.eventRegistration.update({
                where: { id: scopedRegistration.registration.id },
                data: {
                    status: 'REJECTED',
                    reviewedBy: BigInt(req.payload!.userId),
                    reviewedAt: new Date(),
                    reviewNote,
                },
            })

            await notifyStudent({
                studentId: rejected.studentId,
                type: 'EVENT_REGISTRATION_REJECTED',
                title: 'Đăng ký sự kiện bị từ chối',
                body: `Đăng ký sự kiện #${toId(rejected.id)} đã bị từ chối.`,
                data: {
                    campaign_id: toId(rejected.campaignId),
                    module_id: toId(rejected.moduleId),
                    registration_id: toId(rejected.id),
                    review_note: reviewNote,
                },
            })

            await createAuditLog({
                actorId: BigInt(req.payload!.userId),
                action: 'EVENT_REGISTRATION_REJECTED',
                entityType: 'event_registration',
                entityId: rejected.id,
                beforeJson: { status: currentStatus },
                afterJson: {
                    status: rejected.status,
                    review_note: reviewNote,
                },
                ipAddress: req.ip,
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(rejected.id),
                    status: rejected.status,
                    review_note: rejected.reviewNote,
                },
                'Event registration rejected successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

eventsRouter.post(
    '/registrations/:id/check-in',
    requireAuth,
    requireRoles([...ORG_ROLES]),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const registrationId = parseBigIntParam(req.params.id)
            if (!registrationId) {
                return ApiResponse.error(
                    res,
                    'registration id must be a positive integer',
                    400,
                    undefined,
                    'EVENT_REGISTRATION_INVALID_ID'
                )
            }

            const scopedRegistration = await ensureOrgScopeForRegistration(
                registrationId,
                req.payload?.organizationId
            )
            if ('error' in scopedRegistration && scopedRegistration.error) {
                return ApiResponse.error(
                    res,
                    scopedRegistration.error.message,
                    scopedRegistration.error.statusCode,
                    undefined,
                    scopedRegistration.error.code
                )
            }

            if (scopedRegistration.registration.status !== 'APPROVED') {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    {
                        current_status: scopedRegistration.registration.status,
                        allowed_statuses: ['APPROVED'],
                    },
                    'EVENT_REGISTRATION_STATE_CONFLICT'
                )
            }

            const checkedInAt = req.body?.checked_in_at
                ? parseDateInput(String(req.body.checked_in_at))
                : new Date()
            if (req.body?.checked_in_at && !checkedInAt) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    {
                        details: [
                            {
                                field: 'checked_in_at',
                                message: 'checked_in_at must be a valid datetime',
                            },
                        ],
                    },
                    'EVENT_CHECKIN_VALIDATION_FAILED'
                )
            }

            const checkedIn = await prismaClient.eventRegistration.update({
                where: { id: scopedRegistration.registration.id },
                data: {
                    status: 'CHECKED_IN',
                    checkedInAt,
                },
            })

            await notifyStudent({
                studentId: checkedIn.studentId,
                type: 'EVENT_REGISTRATION_CHECKED_IN',
                title: 'Đã check-in sự kiện',
                body: `Bạn đã được check-in cho đăng ký sự kiện #${toId(checkedIn.id)}.`,
                data: {
                    campaign_id: toId(checkedIn.campaignId),
                    module_id: toId(checkedIn.moduleId),
                    registration_id: toId(checkedIn.id),
                },
            })

            await createAuditLog({
                actorId: BigInt(req.payload!.userId),
                action: 'EVENT_REGISTRATION_CHECKED_IN',
                entityType: 'event_registration',
                entityId: checkedIn.id,
                beforeJson: { status: scopedRegistration.registration.status },
                afterJson: { status: checkedIn.status, checked_in_at: checkedIn.checkedInAt },
                ipAddress: req.ip,
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(checkedIn.id),
                    status: checkedIn.status,
                    checked_in_at: checkedIn.checkedInAt,
                },
                'Event registration checked in successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

eventsRouter.post(
    '/registrations/:id/complete',
    requireAuth,
    requireRoles([...ORG_ROLES]),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const registrationId = parseBigIntParam(req.params.id)
            if (!registrationId) {
                return ApiResponse.error(
                    res,
                    'registration id must be a positive integer',
                    400,
                    undefined,
                    'EVENT_REGISTRATION_INVALID_ID'
                )
            }

            const scopedRegistration = await ensureOrgScopeForRegistration(
                registrationId,
                req.payload?.organizationId
            )
            if ('error' in scopedRegistration && scopedRegistration.error) {
                return ApiResponse.error(
                    res,
                    scopedRegistration.error.message,
                    scopedRegistration.error.statusCode,
                    undefined,
                    scopedRegistration.error.code
                )
            }

            const settings = toSettingsObject(scopedRegistration.registration.module.settingsJson)
            const checkinRequired = settings.checkin_required !== false
            const allowedStatuses: EventRegistrationStatus[] = checkinRequired
                ? ['CHECKED_IN']
                : ['APPROVED', 'CHECKED_IN']

            if (!allowedStatuses.includes(scopedRegistration.registration.status)) {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    {
                        current_status: scopedRegistration.registration.status,
                        allowed_statuses: allowedStatuses,
                    },
                    'EVENT_REGISTRATION_STATE_CONFLICT'
                )
            }

            const checkedOutAt = req.body?.checked_out_at
                ? parseDateInput(String(req.body.checked_out_at))
                : new Date()
            if (req.body?.checked_out_at && !checkedOutAt) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    {
                        details: [
                            {
                                field: 'checked_out_at',
                                message: 'checked_out_at must be a valid datetime',
                            },
                        ],
                    },
                    'EVENT_COMPLETE_VALIDATION_FAILED'
                )
            }

            const inputHours =
                req.body?.hours !== undefined ? Number(req.body.hours) : null
            if (inputHours !== null && (!Number.isFinite(inputHours) || inputHours < 0)) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    {
                        details: [
                            {
                                field: 'hours',
                                message: 'hours must be greater than or equal to 0',
                            },
                        ],
                    },
                    'EVENT_COMPLETE_VALIDATION_FAILED'
                )
            }

            const autoHours = (() => {
                const startedAt = scopedRegistration.registration.checkedInAt
                if (!startedAt || !checkedOutAt) return null
                const diffHour =
                    (checkedOutAt.getTime() - startedAt.getTime()) / (1000 * 60 * 60)
                return diffHour > 0 ? Number(diffHour.toFixed(2)) : 0
            })()
            const hours = inputHours ?? autoHours ?? 0
            const note = req.body?.note ? String(req.body.note).trim() : null

            const completed = await prismaClient.eventRegistration.update({
                where: { id: scopedRegistration.registration.id },
                data: {
                    status: 'COMPLETED',
                    checkedOutAt: checkedOutAt ?? undefined,
                    hours,
                    reviewNote: note ?? scopedRegistration.registration.reviewNote,
                    reviewedBy: BigInt(req.payload!.userId),
                    reviewedAt: new Date(),
                },
            })

            await notifyStudent({
                studentId: completed.studentId,
                type: 'EVENT_REGISTRATION_COMPLETED',
                title: 'Đã hoàn thành sự kiện',
                body: `Đăng ký sự kiện #${toId(completed.id)} đã được ghi nhận hoàn thành.`,
                data: {
                    campaign_id: toId(completed.campaignId),
                    module_id: toId(completed.moduleId),
                    registration_id: toId(completed.id),
                    hours,
                },
            })

            await createAuditLog({
                actorId: BigInt(req.payload!.userId),
                action: 'EVENT_REGISTRATION_COMPLETED',
                entityType: 'event_registration',
                entityId: completed.id,
                beforeJson: { status: scopedRegistration.registration.status },
                afterJson: {
                    status: completed.status,
                    checked_out_at: completed.checkedOutAt,
                    hours,
                    note,
                },
                ipAddress: req.ip,
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(completed.id),
                    status: completed.status,
                    checked_out_at: completed.checkedOutAt,
                    hours: toNumber(completed.hours),
                },
                'Event registration completed successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

export default eventsRouter
