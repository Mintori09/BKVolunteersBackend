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
}) =>
    prismaClient.paymentTransaction.update({
        where: { id: args.id },
        data: {
            matchStatus: args.matchStatus,
            matchedDonationId: args.matchedDonationId,
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
