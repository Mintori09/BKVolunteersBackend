import { Prisma } from '@prisma/client'
import { prismaClient } from 'src/config'
import { CreateDonationRecordInput } from './types'

export const toJsonValue = (value: unknown) =>
    value === null || value === undefined
        ? Prisma.JsonNull
        : (value as Prisma.InputJsonValue)

export const findModuleWithCampaign = async (moduleId: bigint) => {
    return prismaClient.campaignModule.findFirst({
        where: {
            id: moduleId,
            deletedAt: null,
            campaign: {
                deletedAt: null,
            },
        },
        include: {
            campaign: {
                select: { id: true, title: true, status: true, slug: true },
            },
            moneyDonations: {
                where: { status: 'VERIFIED' },
                select: { amount: true },
            },
        },
    })
}

export const findModuleBaseById = async (moduleId: bigint) => {
    return prismaClient.campaignModule.findFirst({
        where: {
            id: moduleId,
            deletedAt: null,
            campaign: {
                deletedAt: null,
            },
        },
        include: {
            campaign: {
                select: {
                    id: true,
                    status: true,
                    organizationId: true,
                },
            },
        },
    })
}

export const updateModuleConfig = async (args: {
    moduleId: bigint
    settingsJson: unknown
    status?: string
}) => {
    return prismaClient.campaignModule.update({
        where: { id: args.moduleId },
        data: {
            settingsJson: toJsonValue(args.settingsJson),
            status: args.status,
        },
    })
}

export const createDonation = async (args: CreateDonationRecordInput) =>
    prismaClient.moneyDonation.create({
        data: {
            campaignId: args.campaignId,
            moduleId: args.moduleId,
            studentId: args.studentId,
            donorName: args.donorName,
            amount: args.amount,
            paymentMode: args.paymentMode ?? 'TRANSFER_CODE',
            sepayBankAccountRefId: args.sepayBankAccountRefId ?? null,
            paymentCode: args.paymentCode ?? null,
            paymentExpiresAt: args.paymentExpiresAt ?? null,
            message: args.message,
            evidenceUrl: args.evidenceUrl,
        },
    })

export const updateDonationPaymentInfo = async (args: {
    id: bigint
    paymentCode: string
    paymentExpiresAt: Date
}) =>
    prismaClient.moneyDonation.update({
        where: { id: args.id },
        data: {
            paymentCode: args.paymentCode,
            paymentExpiresAt: args.paymentExpiresAt,
        },
    })

export const findDonations = async (args: {
    page: number
    limit: number
    where: Prisma.MoneyDonationWhereInput
}) => {
    const { page, limit, where } = args
    return Promise.all([
        prismaClient.moneyDonation.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prismaClient.moneyDonation.count({ where }),
    ])
}

export const findDonationById = async (id: bigint) =>
    prismaClient.moneyDonation.findUnique({
        where: { id },
        include: {
            module: {
                select: {
                    id: true,
                    settingsJson: true,
                    campaign: {
                        select: {
                            organizationId: true,
                        },
                    },
                },
            },
            sepayBankAccount: true,
            sepayOrderPayment: {
                include: {
                    sepayBankAccount: true,
                    sepayVirtualAccount: true,
                },
            },
        },
    })

export const findDonationByPaymentCode = async (paymentCode: string) =>
    prismaClient.moneyDonation.findUnique({
        where: { paymentCode },
        include: {
            module: {
                select: {
                    id: true,
                    campaign: {
                        select: {
                            organizationId: true,
                        },
                    },
                },
            },
            sepayBankAccount: true,
            sepayOrderPayment: {
                include: {
                    sepayBankAccount: true,
                    sepayVirtualAccount: true,
                },
            },
        },
    })

export const findPaymentTransactions = async (args: {
    page: number
    limit: number
    where: Prisma.PaymentTransactionWhereInput
}) => {
    const { page, limit, where } = args

    return Promise.all([
        prismaClient.paymentTransaction.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { transactionTime: 'desc' },
            include: {
                campaign: {
                    select: {
                        id: true,
                        organizationId: true,
                    },
                },
                module: {
                    select: {
                        id: true,
                        campaign: {
                            select: {
                                organizationId: true,
                            },
                        },
                    },
                },
                matchedDonation: {
                    select: {
                        id: true,
                        donorName: true,
                        amount: true,
                        status: true,
                        createdAt: true,
                    },
                },
                sepayBankAccount: true,
                sepayVirtualAccount: true,
            },
        }),
        prismaClient.paymentTransaction.count({ where }),
    ])
}

export const findPaymentTransactionById = async (id: bigint) =>
    prismaClient.paymentTransaction.findUnique({
        where: { id },
        include: {
            campaign: {
                select: {
                    id: true,
                    organizationId: true,
                },
            },
            module: {
                select: {
                    id: true,
                    campaign: {
                        select: {
                            organizationId: true,
                        },
                    },
                },
            },
            matchedDonation: {
                select: {
                    id: true,
                    donorName: true,
                    amount: true,
                    status: true,
                    createdAt: true,
                },
            },
            sepayBankAccount: true,
            sepayVirtualAccount: true,
        },
    })

export const updateDonationDecision = async (args: {
    id: bigint
    userId: bigint
    status: 'VERIFIED' | 'REJECTED'
    rejectReason: string | null
}) =>
    prismaClient.moneyDonation.update({
        where: { id: args.id },
        data: {
            status: args.status,
            verifiedBy: args.userId,
            verifiedAt: new Date(),
            rejectReason: args.rejectReason,
        },
    })

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
            entityType: 'money_donation',
            entityId: data.entityId,
            beforeJson: toJsonValue(data.beforeJson),
            afterJson: toJsonValue(data.afterJson),
        },
    })

export const upsertPaymentTransaction = async (args: {
    provider: string
    providerTransactionId: string
    amount: number
    content: string | null
    accountNo: string | null
    transactionTime: Date
    rawPayload: unknown
    ingestSource?: string
    sepayAccountId?: string | null
    sepayVaId?: string | null
    sepayOrderCode?: string | null
    referenceNumber?: string | null
    webhookSuccess?: boolean | null
    sepayBankAccountRefId?: bigint | null
    sepayVirtualAccountRefId?: bigint | null
    campaignId: bigint | null
    moduleId: bigint | null
}) =>
    prismaClient.paymentTransaction.upsert({
        where: {
            provider_providerTransactionId: {
                provider: args.provider,
                providerTransactionId: args.providerTransactionId,
            },
        },
        update: {
            amount: args.amount,
            content: args.content,
            accountNo: args.accountNo,
            transactionTime: args.transactionTime,
            rawPayload: toJsonValue(args.rawPayload),
            ingestSource: args.ingestSource,
            sepayAccountId: args.sepayAccountId,
            sepayVaId: args.sepayVaId,
            sepayOrderCode: args.sepayOrderCode,
            referenceNumber: args.referenceNumber,
            webhookSuccess: args.webhookSuccess ?? null,
            sepayBankAccountRefId: args.sepayBankAccountRefId ?? null,
            sepayVirtualAccountRefId: args.sepayVirtualAccountRefId ?? null,
            campaignId: args.campaignId,
            moduleId: args.moduleId,
        },
        create: {
            provider: args.provider,
            providerTransactionId: args.providerTransactionId,
            amount: args.amount,
            content: args.content,
            accountNo: args.accountNo,
            transactionTime: args.transactionTime,
            rawPayload: toJsonValue(args.rawPayload),
            ingestSource: args.ingestSource ?? 'WEBHOOK',
            sepayAccountId: args.sepayAccountId,
            sepayVaId: args.sepayVaId,
            sepayOrderCode: args.sepayOrderCode,
            referenceNumber: args.referenceNumber,
            webhookSuccess: args.webhookSuccess ?? null,
            sepayBankAccountRefId: args.sepayBankAccountRefId ?? null,
            sepayVirtualAccountRefId: args.sepayVirtualAccountRefId ?? null,
            campaignId: args.campaignId,
            moduleId: args.moduleId,
        },
    })

export const findPendingDonationMatch = async (args: {
    moduleId: bigint
    amount: number
}) =>
    prismaClient.moneyDonation.findFirst({
        where: {
            moduleId: args.moduleId,
            amount: args.amount,
            status: 'PENDING',
            matchedTransactionId: null,
        },
        orderBy: { createdAt: 'asc' },
    })

export const updatePaymentTransactionMatch = async (args: {
    id: bigint
    matchStatus: string
    matchedDonationId?: bigint
    campaignId?: bigint | null
    moduleId?: bigint | null
}) =>
    prismaClient.paymentTransaction.update({
        where: { id: args.id },
        data: {
            matchStatus: args.matchStatus,
            matchedDonationId: args.matchedDonationId,
            ...(args.campaignId !== undefined ? { campaignId: args.campaignId } : {}),
            ...(args.moduleId !== undefined ? { moduleId: args.moduleId } : {}),
        },
    })

export const attachDonationMatch = async (args: {
    donationId: bigint
    transactionId: bigint
}) =>
    prismaClient.moneyDonation.update({
        where: { id: args.donationId },
        data: {
            matchedTransactionId: args.transactionId,
            matchedAt: new Date(),
            status: 'MATCHED',
        },
    })

export const clearDonationMatch = async (args: {
    donationId: bigint
    status?: string
}) =>
    prismaClient.moneyDonation.update({
        where: { id: args.donationId },
        data: {
            matchedTransactionId: null,
            matchedAt: null,
            ...(args.status ? { status: args.status } : {}),
        },
    })

export const findSepayBankAccounts = async (args?: {
    where?: Prisma.SepayBankAccountWhereInput
}) =>
    prismaClient.sepayBankAccount.findMany({
        where: args?.where,
        orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }],
    })

export const findScopedSepayBankAccounts = async (args: {
    organizationId: bigint
    where?: Prisma.SepayBankAccountWhereInput
}) =>
    prismaClient.sepayBankAccount.findMany({
        where: {
            ...(args.where ?? {}),
            organizationScopes: {
                some: {
                    organizationId: args.organizationId,
                },
            },
        },
        orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }],
    })

export const countSepayBankAccounts = async (where?: Prisma.SepayBankAccountWhereInput) =>
    prismaClient.sepayBankAccount.count({ where })

export const upsertSepayBankAccount = async (args: {
    sepayAccountId: string
    accountHolderName: string
    accountNumber: string
    accumulated?: number | null
    lastTransaction?: Date | null
    label?: string | null
    active: boolean
    bankShortName?: string | null
    bankFullName?: string | null
    bankCode?: string | null
    apiMode: string
    metadataJson?: unknown
}) =>
    prismaClient.sepayBankAccount.upsert({
        where: { sepayAccountId: args.sepayAccountId },
        update: {
            accountHolderName: args.accountHolderName,
            accountNumber: args.accountNumber,
            accumulated: args.accumulated ?? null,
            lastTransaction: args.lastTransaction ?? null,
            label: args.label ?? null,
            active: args.active,
            bankShortName: args.bankShortName ?? null,
            bankFullName: args.bankFullName ?? null,
            bankCode: args.bankCode ?? null,
            apiMode: args.apiMode,
            metadataJson: toJsonValue(args.metadataJson),
        },
        create: {
            sepayAccountId: args.sepayAccountId,
            accountHolderName: args.accountHolderName,
            accountNumber: args.accountNumber,
            accumulated: args.accumulated ?? null,
            lastTransaction: args.lastTransaction ?? null,
            label: args.label ?? null,
            active: args.active,
            bankShortName: args.bankShortName ?? null,
            bankFullName: args.bankFullName ?? null,
            bankCode: args.bankCode ?? null,
            apiMode: args.apiMode,
            metadataJson: toJsonValue(args.metadataJson),
        },
    })

export const findSepayBankAccountBySepayId = async (sepayAccountId: string) =>
    prismaClient.sepayBankAccount.findUnique({
        where: { sepayAccountId },
    })

export const isSepayAccountMappedToOrganization = async (args: {
    sepayBankAccountId: bigint
    organizationId: bigint
}) => {
    const scope = await prismaClient.sepayOrganizationScope.findFirst({
        where: {
            sepayBankAccountId: args.sepayBankAccountId,
            organizationId: args.organizationId,
        },
        select: { id: true },
    })
    return Boolean(scope)
}

export const upsertSepayOrganizationScope = async (args: {
    sepayBankAccountId: bigint
    organizationId: bigint
    source?: string
    metadataJson?: unknown
}) =>
    prismaClient.sepayOrganizationScope.upsert({
        where: {
            sepayBankAccountId_organizationId: {
                sepayBankAccountId: args.sepayBankAccountId,
                organizationId: args.organizationId,
            },
        },
        update: {
            source: args.source ?? 'MODULE_CONFIG',
            metadataJson: toJsonValue(args.metadataJson),
        },
        create: {
            sepayBankAccountId: args.sepayBankAccountId,
            organizationId: args.organizationId,
            source: args.source ?? 'MODULE_CONFIG',
            metadataJson: toJsonValue(args.metadataJson),
        },
    })

export const createSepayOperationRequest = async (args: {
    organizationId: bigint
    requesterId: bigint
    requesterRole: string
    requestType: string
    sepayBankAccountId?: bigint | null
    campaignId?: bigint | null
    moduleId?: bigint | null
    donationId?: bigint | null
    note?: string | null
}) =>
    prismaClient.sepayOperationRequest.create({
        data: {
            organizationId: args.organizationId,
            requesterId: args.requesterId,
            requesterRole: args.requesterRole,
            requestType: args.requestType,
            sepayBankAccountId: args.sepayBankAccountId ?? null,
            campaignId: args.campaignId ?? null,
            moduleId: args.moduleId ?? null,
            donationId: args.donationId ?? null,
            note: args.note ?? null,
        },
        include: {
            sepayBankAccount: true,
        },
    })

export const findSepayOperationRequests = async (args: {
    where: Prisma.SepayOperationRequestWhereInput
}) =>
    prismaClient.sepayOperationRequest.findMany({
        where: args.where,
        include: {
            sepayBankAccount: true,
        },
        orderBy: [{ createdAt: 'desc' }],
    })

export const findSepayOperationRequestById = async (id: bigint) =>
    prismaClient.sepayOperationRequest.findUnique({
        where: { id },
        include: {
            sepayBankAccount: true,
        },
    })

export const decideSepayOperationRequest = async (args: {
    id: bigint
    status: 'APPROVED' | 'REJECTED'
    decidedBy: bigint
    decisionNote?: string | null
}) =>
    prismaClient.sepayOperationRequest.update({
        where: { id: args.id },
        data: {
            status: args.status,
            decidedBy: args.decidedBy,
            decisionNote: args.decisionNote ?? null,
            decidedAt: new Date(),
        },
        include: {
            sepayBankAccount: true,
        },
    })

export const upsertSepaySyncCursor = async (args: {
    type: string
    sepayBankAccountId?: bigint | null
    cursorValue?: string | null
    lastSyncedAt?: Date | null
    lastError?: string | null
    metadataJson?: unknown
}) =>
    prismaClient.sepaySyncCursor
        .findFirst({
            where: {
                type: args.type,
                sepayBankAccountId: args.sepayBankAccountId ?? null,
            },
        })
        .then((existing) =>
            existing
                ? prismaClient.sepaySyncCursor.update({
                    where: { id: existing.id },
                    data: {
                        cursorValue: args.cursorValue ?? null,
                        lastSyncedAt: args.lastSyncedAt ?? null,
                        lastError: args.lastError ?? null,
                        metadataJson: toJsonValue(args.metadataJson),
                    },
                })
                : prismaClient.sepaySyncCursor.create({
                    data: {
                        type: args.type,
                        sepayBankAccountId: args.sepayBankAccountId ?? null,
                        cursorValue: args.cursorValue ?? null,
                        lastSyncedAt: args.lastSyncedAt ?? null,
                        lastError: args.lastError ?? null,
                        metadataJson: toJsonValue(args.metadataJson),
                    },
                })
        )

export const findSepaySyncCursors = async () =>
    prismaClient.sepaySyncCursor.findMany({
        include: {
            sepayBankAccount: true,
        },
        orderBy: [{ type: 'asc' }, { updatedAt: 'desc' }],
    })

export const upsertSepayVirtualAccount = async (args: {
    sepayVaId: string
    sepayBankAccountId: bigint
    vaNumber: string
    subHolderName?: string | null
    label?: string | null
    active: boolean
    official: boolean
    isStatic: boolean
    sourceType?: string
    metadataJson?: unknown
}) =>
    prismaClient.sepayVirtualAccount.upsert({
        where: { sepayVaId: args.sepayVaId },
        update: {
            sepayBankAccountId: args.sepayBankAccountId,
            vaNumber: args.vaNumber,
            subHolderName: args.subHolderName ?? null,
            label: args.label ?? null,
            active: args.active,
            official: args.official,
            isStatic: args.isStatic,
            sourceType: args.sourceType ?? 'DIRECT',
            metadataJson: toJsonValue(args.metadataJson),
        },
        create: {
            sepayVaId: args.sepayVaId,
            sepayBankAccountId: args.sepayBankAccountId,
            vaNumber: args.vaNumber,
            subHolderName: args.subHolderName ?? null,
            label: args.label ?? null,
            active: args.active,
            official: args.official,
            isStatic: args.isStatic,
            sourceType: args.sourceType ?? 'DIRECT',
            metadataJson: toJsonValue(args.metadataJson),
        },
    })

export const countSepayVirtualAccounts = async () =>
    prismaClient.sepayVirtualAccount.count()

export const findSepayVirtualAccountBySepayId = async (sepayVaId: string) =>
    prismaClient.sepayVirtualAccount.findUnique({
        where: { sepayVaId },
    })

export const upsertSepayOrderPayment = async (args: {
    moneyDonationId: bigint
    sepayBankAccountId: bigint
    sepayVirtualAccountId?: bigint | null
    sepayOrderId: string
    orderCode: string
    amount: number
    paidAmount?: number
    status: string
    vaPrefix?: string | null
    providerQrUrl?: string | null
    expiresAt?: Date | null
    paidAt?: Date | null
    payloadJson?: unknown
}) =>
    prismaClient.sepayOrderPayment.upsert({
        where: { moneyDonationId: args.moneyDonationId },
        update: {
            sepayBankAccountId: args.sepayBankAccountId,
            sepayVirtualAccountId: args.sepayVirtualAccountId ?? null,
            sepayOrderId: args.sepayOrderId,
            orderCode: args.orderCode,
            amount: args.amount,
            paidAmount: args.paidAmount ?? 0,
            status: args.status,
            vaPrefix: args.vaPrefix ?? null,
            providerQrUrl: args.providerQrUrl ?? null,
            expiresAt: args.expiresAt ?? null,
            paidAt: args.paidAt ?? null,
            payloadJson: toJsonValue(args.payloadJson),
        },
        create: {
            moneyDonationId: args.moneyDonationId,
            sepayBankAccountId: args.sepayBankAccountId,
            sepayVirtualAccountId: args.sepayVirtualAccountId ?? null,
            sepayOrderId: args.sepayOrderId,
            orderCode: args.orderCode,
            amount: args.amount,
            paidAmount: args.paidAmount ?? 0,
            status: args.status,
            vaPrefix: args.vaPrefix ?? null,
            providerQrUrl: args.providerQrUrl ?? null,
            expiresAt: args.expiresAt ?? null,
            paidAt: args.paidAt ?? null,
            payloadJson: toJsonValue(args.payloadJson),
        },
    })

export const findSepayOrderPaymentByDonationId = async (moneyDonationId: bigint) =>
    prismaClient.sepayOrderPayment.findUnique({
        where: { moneyDonationId },
        include: {
            sepayBankAccount: true,
            sepayVirtualAccount: true,
            donation: true,
        },
    })

export const findSepayOrderPaymentByOrderCode = async (orderCode: string) =>
    prismaClient.sepayOrderPayment.findUnique({
        where: { orderCode },
        include: {
            donation: {
                include: {
                    module: {
                        select: {
                            campaign: {
                                select: { organizationId: true },
                            },
                        },
                    },
                },
            },
            sepayBankAccount: true,
            sepayVirtualAccount: true,
        },
    })

export const countSepayOrderPayments = async () =>
    prismaClient.sepayOrderPayment.count()

export const createBackgroundJob = async (args: {
    type: string
    payloadJson: unknown
    runAt?: Date
}) =>
    prismaClient.backgroundJob.create({
        data: {
            type: args.type,
            payloadJson: toJsonValue(args.payloadJson),
            runAt: args.runAt ?? new Date(),
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
