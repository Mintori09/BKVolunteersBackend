import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { prismaClient } from 'src/config'
import {
    requireAccountType,
    requireAuth,
    requireRoles,
} from 'src/common/middleware'
import { ApiResponse } from 'src/utils/ApiResponse'

const fundraisingRouter = Router()
const DONATION_STATUSES = ['PENDING', 'MATCHED', 'VERIFIED', 'REJECTED', 'REFUNDED'] as const

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

const toJsonInput = (
    value: unknown
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
    if (value == null) return undefined
    return value as Prisma.InputJsonValue
}

const getFundraisingModule = async (moduleId: bigint) =>
    prismaClient.campaignModule.findFirst({
        where: {
            id: moduleId,
            deletedAt: null,
            type: 'fundraising',
        },
        include: {
            campaign: true,
        },
    })

const ensureOrgScopeForModule = async (
    moduleId: bigint,
    organizationId: string | null | undefined
) => {
    const module = await getFundraisingModule(moduleId)

    if (!module) {
        return {
            error: {
                statusCode: 404,
                code: 'FUNDRAISING_MODULE_NOT_FOUND',
                message: 'Fundraising module not found',
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

    return {
        module,
    } as const
}

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

fundraisingRouter.get('/modules/:moduleId', async (req, res, next) => {
    try {
        const moduleId = parseBigIntParam(req.params.moduleId)
        if (!moduleId) {
            return ApiResponse.error(
                res,
                'module id must be a positive integer',
                400,
                undefined,
                'FUNDRAISING_INVALID_MODULE_ID'
            )
        }

        const module = await getFundraisingModule(moduleId)
        if (!module) {
            return ApiResponse.error(
                res,
                'Fundraising module not found',
                404,
                undefined,
                'FUNDRAISING_MODULE_NOT_FOUND'
            )
        }

        const [verified, pending] = await Promise.all([
            prismaClient.moneyDonation.aggregate({
                where: { moduleId: module.id, status: 'VERIFIED' },
                _sum: { amount: true },
            }),
            prismaClient.moneyDonation.aggregate({
                where: { moduleId: module.id, status: 'PENDING' },
                _sum: { amount: true },
            }),
        ])

        const settings = module.settingsJson && typeof module.settingsJson === 'object'
            ? (module.settingsJson as Record<string, unknown>)
            : {}
        const targetAmount = toNumber(settings.target_amount ?? settings.targetAmount)
        const verifiedAmount = toNumber(verified._sum.amount)

        return ApiResponse.success(
            res,
            {
                module_id: toId(module.id),
                campaign_id: toId(module.campaignId),
                status: module.status,
                config: settings,
                progress: {
                    target_amount: targetAmount,
                    verified_amount: verifiedAmount,
                    pending_amount: toNumber(pending._sum.amount),
                    percent:
                        targetAmount > 0
                            ? Math.min(100, Math.round((verifiedAmount / targetAmount) * 100))
                            : 0,
                },
                payment_instruction: {
                    receiver_name: settings.receiver_name ?? null,
                    bank_name: settings.bank_name ?? null,
                    bank_account_no: settings.bank_account_no ?? null,
                    transfer_content_prefix:
                        settings.transfer_content_prefix ?? 'BKVOL',
                },
            },
            'Fundraising module fetched successfully'
        )
    } catch (error) {
        next(error)
    }
})

fundraisingRouter.patch(
    '/modules/:moduleId/config',
    requireAuth,
    requireRoles(['ORG_ADMIN']),
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
                    'FUNDRAISING_INVALID_MODULE_ID'
                )
            }

            const scopedModule = await ensureOrgScopeForModule(
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

            const targetAmount = Number(req.body?.target_amount ?? 0)
            const receiverName = String(req.body?.receiver_name ?? '').trim()
            const bankName = String(req.body?.bank_name ?? '').trim()
            const bankAccountNo = String(req.body?.bank_account_no ?? '').trim()
            const currency = String(req.body?.currency ?? 'VND').trim()
            const sepayEnabled = Boolean(req.body?.sepay_enabled)
            const sepayAccountId = req.body?.sepay_account_id
                ? String(req.body.sepay_account_id).trim()
                : null

            const details: Array<{ field: string; message: string }> = []
            if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
                details.push({
                    field: 'target_amount',
                    message: 'target_amount must be greater than 0',
                })
            }
            if (!receiverName) {
                details.push({
                    field: 'receiver_name',
                    message: 'receiver_name is required',
                })
            }
            if (!bankName) {
                details.push({
                    field: 'bank_name',
                    message: 'bank_name is required',
                })
            }
            if (!bankAccountNo) {
                details.push({
                    field: 'bank_account_no',
                    message: 'bank_account_no is required',
                })
            }
            if (sepayEnabled && !sepayAccountId) {
                details.push({
                    field: 'sepay_account_id',
                    message: 'sepay_account_id is required when sepay_enabled=true',
                })
            }

            if (details.length > 0) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    { details },
                    'FUNDRAISING_CONFIG_VALIDATION_FAILED'
                )
            }

            const currentConfig =
                scopedModule.module.settingsJson &&
                typeof scopedModule.module.settingsJson === 'object'
                    ? (scopedModule.module.settingsJson as Record<string, unknown>)
                    : {}

            const nextConfig = {
                ...currentConfig,
                target_amount: targetAmount,
                currency,
                receiver_name: receiverName,
                bank_name: bankName,
                bank_account_no: bankAccountNo,
                sepay_enabled: sepayEnabled,
                sepay_account_id: sepayAccountId,
                transfer_content_prefix:
                    currentConfig.transfer_content_prefix ?? 'BKVOL',
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
                'Fundraising config updated successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

fundraisingRouter.post(
    '/modules/:moduleId/donations',
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
                    'FUNDRAISING_INVALID_MODULE_ID'
                )
            }

            const module = await getFundraisingModule(moduleId)
            if (!module) {
                return ApiResponse.error(
                    res,
                    'Fundraising module not found',
                    404,
                    undefined,
                    'FUNDRAISING_MODULE_NOT_FOUND'
                )
            }

            if (module.status !== 'OPEN') {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    { current_status: module.status, allowed_statuses: ['OPEN'] },
                    'FUNDRAISING_MODULE_CLOSED'
                )
            }

            const amount = Number(req.body?.amount ?? 0)
            const donorName = String(req.body?.donor_name ?? '').trim()
            const message = req.body?.message ? String(req.body.message).trim() : null
            const evidenceUrl = req.body?.evidence_url
                ? String(req.body.evidence_url).trim()
                : null

            const details: Array<{ field: string; message: string }> = []
            if (!Number.isFinite(amount) || amount <= 0) {
                details.push({
                    field: 'amount',
                    message: 'amount must be greater than 0',
                })
            }
            if (!donorName) {
                details.push({
                    field: 'donor_name',
                    message: 'donor_name is required',
                })
            }

            if (details.length > 0) {
                return ApiResponse.error(
                    res,
                    'Validation failed',
                    422,
                    { details },
                    'FUNDRAISING_DONATION_VALIDATION_FAILED'
                )
            }

            const donation = await prismaClient.moneyDonation.create({
                data: {
                    campaignId: module.campaignId,
                    moduleId: module.id,
                    studentId: BigInt(req.payload!.userId),
                    donorName,
                    amount,
                    message,
                    evidenceUrl,
                    status: 'PENDING',
                },
            })

            const config =
                module.settingsJson && typeof module.settingsJson === 'object'
                    ? (module.settingsJson as Record<string, unknown>)
                    : {}

            return ApiResponse.success(
                res,
                {
                    id: toId(donation.id),
                    module_id: toId(donation.moduleId),
                    campaign_id: toId(donation.campaignId),
                    status: donation.status,
                    amount: toNumber(donation.amount),
                    payment_instruction: {
                        receiver_name: config.receiver_name ?? null,
                        bank_name: config.bank_name ?? null,
                        bank_account_no: config.bank_account_no ?? null,
                        transfer_content: `${config.transfer_content_prefix ?? 'BKVOL'} ${toId(
                            donation.id
                        )}`,
                    },
                },
                'Donation created successfully',
                201
            )
        } catch (error) {
            next(error)
        }
    }
)

fundraisingRouter.get(
    '/modules/:moduleId/donations',
    requireAuth,
    requireRoles(['ORG_ADMIN', 'ORG_MEMBER']),
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
                    'FUNDRAISING_INVALID_MODULE_ID'
                )
            }

            const scopedModule = await ensureOrgScopeForModule(
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
            const status = String(req.query.status ?? '').trim()
            const from = req.query.from ? new Date(String(req.query.from)) : null
            const to = req.query.to ? new Date(String(req.query.to)) : null

            if (
                status &&
                !DONATION_STATUSES.includes(
                    status as (typeof DONATION_STATUSES)[number]
                )
            ) {
                return ApiResponse.error(
                    res,
                    'status must be one of PENDING, MATCHED, VERIFIED, REJECTED or REFUNDED',
                    400,
                    { status },
                    'FUNDRAISING_INVALID_FILTER'
                )
            }

            const where = {
                moduleId: scopedModule.module.id,
                ...(status && { status: status as any }),
                ...(q && {
                    OR: [
                        { donorName: { contains: q } },
                        { message: { contains: q } },
                    ],
                }),
                ...((from || to) && {
                    createdAt: {
                        ...(from && !Number.isNaN(from.getTime()) && { gte: from }),
                        ...(to && !Number.isNaN(to.getTime()) && { lte: to }),
                    },
                }),
            }

            const [total, donations] = await Promise.all([
                prismaClient.moneyDonation.count({ where }),
                prismaClient.moneyDonation.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
            ])

            return ApiResponse.success(
                res,
                donations.map((donation) => ({
                    id: toId(donation.id),
                    module_id: toId(donation.moduleId),
                    student_id: toId(donation.studentId),
                    donor_name: donation.donorName,
                    amount: toNumber(donation.amount),
                    status: donation.status,
                    message: donation.message,
                    evidence_url: donation.evidenceUrl,
                    created_at: donation.createdAt,
                    verified_at: donation.verifiedAt,
                    reject_reason: donation.rejectReason,
                })),
                'Fundraising donations fetched successfully',
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

fundraisingRouter.patch(
    '/donations/:id/verify',
    requireAuth,
    requireRoles(['ORG_ADMIN']),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const donationId = parseBigIntParam(req.params.id)
            if (!donationId) {
                return ApiResponse.error(
                    res,
                    'donation id must be a positive integer',
                    400,
                    undefined,
                    'FUNDRAISING_INVALID_DONATION_ID'
                )
            }

            const donation = await prismaClient.moneyDonation.findFirst({
                where: { id: donationId },
                include: {
                    campaign: true,
                },
            })

            if (!donation) {
                return ApiResponse.error(
                    res,
                    'Donation not found',
                    404,
                    undefined,
                    'FUNDRAISING_DONATION_NOT_FOUND'
                )
            }

            if (
                String(donation.campaign.organizationId) !==
                String(req.payload?.organizationId)
            ) {
                return ApiResponse.error(
                    res,
                    'You can only verify donations in your organization',
                    403,
                    undefined,
                    'FORBIDDEN_ORGANIZATION_SCOPE'
                )
            }

            if (!['PENDING', 'MATCHED'].includes(donation.status)) {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    {
                        current_status: donation.status,
                        allowed_statuses: ['PENDING', 'MATCHED'],
                    },
                    'FUNDRAISING_DONATION_STATE_CONFLICT'
                )
            }

            const transactionId = req.body?.transaction_id
                ? parseBigIntParam(String(req.body.transaction_id))
                : null
            const note = req.body?.note ? String(req.body.note) : null

            const updated = await prismaClient.moneyDonation.update({
                where: { id: donation.id },
                data: {
                    status: 'VERIFIED',
                    verifiedBy: BigInt(req.payload!.userId),
                    verifiedAt: new Date(),
                    matchedTransactionId: transactionId,
                    rejectReason: null,
                },
            })

            await createAuditLog({
                actorId: BigInt(req.payload!.userId),
                action: 'MONEY_DONATION_VERIFIED',
                entityType: 'money_donation',
                entityId: donation.id,
                beforeJson: {
                    status: donation.status,
                },
                afterJson: {
                    status: updated.status,
                    note,
                    transaction_id: toId(transactionId),
                },
                ipAddress: req.ip,
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(updated.id),
                    status: updated.status,
                    verified_at: updated.verifiedAt,
                    verified_by: toId(updated.verifiedBy),
                },
                'Donation verified successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

fundraisingRouter.patch(
    '/donations/:id/reject',
    requireAuth,
    requireRoles(['ORG_ADMIN']),
    requireAccountType('OPERATOR'),
    async (req, res, next) => {
        try {
            const donationId = parseBigIntParam(req.params.id)
            if (!donationId) {
                return ApiResponse.error(
                    res,
                    'donation id must be a positive integer',
                    400,
                    undefined,
                    'FUNDRAISING_INVALID_DONATION_ID'
                )
            }

            const donation = await prismaClient.moneyDonation.findFirst({
                where: { id: donationId },
                include: {
                    campaign: true,
                },
            })

            if (!donation) {
                return ApiResponse.error(
                    res,
                    'Donation not found',
                    404,
                    undefined,
                    'FUNDRAISING_DONATION_NOT_FOUND'
                )
            }

            if (
                String(donation.campaign.organizationId) !==
                String(req.payload?.organizationId)
            ) {
                return ApiResponse.error(
                    res,
                    'You can only reject donations in your organization',
                    403,
                    undefined,
                    'FORBIDDEN_ORGANIZATION_SCOPE'
                )
            }

            if (!['PENDING', 'MATCHED'].includes(donation.status)) {
                return ApiResponse.error(
                    res,
                    'State conflict',
                    409,
                    {
                        current_status: donation.status,
                        allowed_statuses: ['PENDING', 'MATCHED'],
                    },
                    'FUNDRAISING_DONATION_STATE_CONFLICT'
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
                    'FUNDRAISING_REJECT_REASON_REQUIRED'
                )
            }

            const updated = await prismaClient.moneyDonation.update({
                where: { id: donation.id },
                data: {
                    status: 'REJECTED',
                    rejectReason: reason,
                },
            })

            await createAuditLog({
                actorId: BigInt(req.payload!.userId),
                action: 'MONEY_DONATION_REJECTED',
                entityType: 'money_donation',
                entityId: donation.id,
                beforeJson: {
                    status: donation.status,
                },
                afterJson: {
                    status: updated.status,
                    reason,
                },
                ipAddress: req.ip,
            })

            return ApiResponse.success(
                res,
                {
                    id: toId(updated.id),
                    status: updated.status,
                    reject_reason: updated.rejectReason,
                },
                'Donation rejected successfully'
            )
        } catch (error) {
            next(error)
        }
    }
)

fundraisingRouter.post('/sepay/webhook', async (req, res, next) => {
    try {
        const providerTransactionId = String(req.body?.id ?? '').trim()
        const amount = Number(req.body?.amount ?? 0)
        const content = req.body?.content ? String(req.body.content) : null
        const accountNo = req.body?.account_no ? String(req.body.account_no) : null
        const transactionTime = req.body?.transaction_time
            ? new Date(String(req.body.transaction_time))
            : new Date()
        const signatureHeader = String(req.headers['x-sepay-signature'] ?? '')
        const signatureBody = String(req.body?.signature ?? '')
        const incomingSignature = signatureHeader || signatureBody
        const webhookSecret = process.env.SEPAY_WEBHOOK_SECRET?.trim()

        if (!webhookSecret) {
            console.warn(
                '[fundraising/sepay/webhook] Webhook secret is not configured. Signature check is skipped.'
            )
        }

        const details: Array<{ field: string; message: string }> = []
        if (!providerTransactionId) {
            details.push({
                field: 'id',
                message: 'id is required',
            })
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            details.push({
                field: 'amount',
                message: 'amount must be greater than 0',
            })
        }
        if (Number.isNaN(transactionTime.getTime())) {
            details.push({
                field: 'transaction_time',
                message: 'transaction_time must be a valid datetime',
            })
        }

        if (details.length > 0) {
            return ApiResponse.error(
                res,
                'Validation failed',
                422,
                { details },
                'SEPAY_WEBHOOK_VALIDATION_FAILED'
            )
        }

        if (webhookSecret && incomingSignature !== webhookSecret) {
            return ApiResponse.error(
                res,
                'Webhook signature is invalid',
                401,
                undefined,
                'SEPAY_WEBHOOK_INVALID_SIGNATURE'
            )
        }

        const existed = await prismaClient.paymentTransaction.findFirst({
            where: {
                provider: 'SEPAY',
                providerTransactionId,
            },
            select: {
                id: true,
                matchStatus: true,
            },
        })

        if (existed) {
            return ApiResponse.success(
                res,
                {
                    transaction_id: toId(existed.id),
                    provider: 'SEPAY',
                    duplicate: true,
                    match_status: existed.matchStatus,
                    signature_verified: webhookSecret
                        ? incomingSignature === webhookSecret
                        : false,
                },
                'Webhook processed successfully'
            )
        }

        const created = await prismaClient.paymentTransaction.create({
            data: {
                provider: 'SEPAY',
                providerTransactionId,
                amount,
                content,
                transactionTime,
                rawPayload: toJsonInput(req.body ?? {}) as Prisma.InputJsonValue,
                matchStatus: 'UNMATCHED',
            },
        })

        let matchedDonation: {
            id: bigint
            moduleId: bigint
            campaignId: bigint
            status: string
        } | null = null

        const donationIdFromContent = (() => {
            if (!content) return null
            const matched =
                content.match(/(?:BKVOL|DONATION)\s*([0-9]{1,12})/i) ||
                content.match(/^([0-9]{1,12})$/)
            if (!matched?.[1]) return null
            if (!/^\d+$/.test(matched[1])) return null
            return BigInt(matched[1])
        })()

        if (donationIdFromContent) {
            const donation = await prismaClient.moneyDonation.findFirst({
                where: {
                    id: donationIdFromContent,
                    status: 'PENDING',
                },
                select: {
                    id: true,
                    amount: true,
                    moduleId: true,
                    campaignId: true,
                    status: true,
                },
            })

            if (donation && toNumber(donation.amount) === amount) {
                const [nextDonation] = await prismaClient.$transaction([
                    prismaClient.moneyDonation.update({
                        where: { id: donation.id },
                        data: {
                            status: 'MATCHED',
                            matchedTransactionId: created.id,
                        },
                        select: {
                            id: true,
                            status: true,
                            moduleId: true,
                            campaignId: true,
                        },
                    }),
                    prismaClient.paymentTransaction.update({
                        where: { id: created.id },
                        data: {
                            matchStatus: 'MATCHED',
                            moduleId: donation.moduleId,
                            campaignId: donation.campaignId,
                        },
                    }),
                ])

                matchedDonation = {
                    id: nextDonation.id,
                    moduleId: nextDonation.moduleId,
                    campaignId: nextDonation.campaignId,
                    status: nextDonation.status,
                }
            }
        }

        return ApiResponse.success(
            res,
            {
                transaction_id: toId(created.id),
                provider: 'SEPAY',
                duplicate: false,
                match_status: matchedDonation ? 'MATCHED' : 'UNMATCHED',
                donation_id: matchedDonation ? toId(matchedDonation.id) : null,
                donation_status: matchedDonation ? matchedDonation.status : null,
                signature_verified: webhookSecret
                    ? incomingSignature === webhookSecret
                    : false,
                signature_mode: webhookSecret ? 'OPTIONAL_WITH_SECRET' : 'OPTIONAL_NO_SECRET',
                account_no: accountNo,
            },
            matchedDonation
                ? 'Webhook processed and donation matched'
                : 'Webhook processed successfully'
        )
    } catch (error) {
        next(error)
    }
})

export default fundraisingRouter
