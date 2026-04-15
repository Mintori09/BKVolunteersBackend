import { Prisma, DonationStatus } from '@prisma/client'
import prismaClient from 'src/config/prisma'
import {
    CreateDonationInput,
    DonationFilterQuery,
    AdminDonationFilterQuery,
} from './donation.types'

export const findDonationById = async (id: string) => {
    return prismaClient.donation.findUnique({
        where: { id },
        include: {
            student: {
                select: {
                    id: true,
                    mssv: true,
                    fullName: true,
                },
            },
            moneyPhase: {
                include: {
                    campaign: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                            creatorId: true,
                        },
                    },
                },
            },
            itemPhase: {
                include: {
                    campaign: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                            creatorId: true,
                        },
                    },
                },
            },
        },
    })
}

export const createDonation = async (
    studentId: string,
    data: CreateDonationInput
) => {
    return prismaClient.donation.create({
        data: {
            studentId,
            moneyPhaseId: data.moneyPhaseId,
            amount: data.amount,
            proofImageUrl: data.proofImageUrl,
            status: 'PENDING',
        },
    })
}

export const rejectDonation = async (id: string, reason: string) => {
    return prismaClient.donation.update({
        where: { id },
        data: {
            status: 'REJECTED',
            rejectionReason: reason,
        },
    })
}

export const verifyDonation = async (id: string, verifiedAmount: number) => {
    return prismaClient.$transaction(async (tx) => {
        const donation = await tx.donation.update({
            where: { id },
            data: {
                status: 'VERIFIED',
                verifiedAmount,
            },
            include: {
                moneyPhase: true,
            },
        })

        if (donation.moneyPhase) {
            await tx.moneyDonationCampaign.update({
                where: { id: donation.moneyPhase.id },
                data: {
                    currentAmount: {
                        increment: verifiedAmount,
                    },
                },
            })
        }

        return donation
    })
}

export const findDonationsByStudent = async (
    studentId: string,
    query: DonationFilterQuery
) => {
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const skip = (page - 1) * limit

    const where: Prisma.DonationWhereInput = {
        studentId,
    }

    if (query.status) {
        where.status = query.status
    }

    const [donations, total] = await Promise.all([
        prismaClient.donation.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                amount: true,
                verifiedAmount: true,
                proofImageUrl: true,
                status: true,
                rejectionReason: true,
                createdAt: true,
                moneyPhase: {
                    select: {
                        id: true,
                        campaign: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
        }),
        prismaClient.donation.count({ where }),
    ])

    return {
        donations: donations.map((d) => ({
            ...d,
            amount: d.amount.toString(),
            verifiedAmount: d.verifiedAmount
                ? d.verifiedAmount.toString()
                : null,
        })),
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    }
}

export const findMoneyPhaseWithCampaign = async (phaseId: number) => {
    return prismaClient.moneyDonationCampaign.findUnique({
        where: { id: phaseId, deletedAt: null },
        include: {
            campaign: {
                select: {
                    id: true,
                    title: true,
                    status: true,
                    creatorId: true,
                },
            },
        },
    })
}

export const findDonationsForAdmin = async (
    query: AdminDonationFilterQuery
) => {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const skip = (page - 1) * limit

    const where: Prisma.DonationWhereInput = {}

    if (query.status) {
        where.status = query.status
    }
    if (query.studentId) {
        where.studentId = query.studentId
    }
    if (query.phaseType === 'money') {
        where.moneyPhaseId = { not: null }
    }
    if (query.phaseType === 'item') {
        where.itemPhaseId = { not: null }
    }

    const [donations, total] = await Promise.all([
        prismaClient.donation.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                student: {
                    select: {
                        id: true,
                        mssv: true,
                        fullName: true,
                        email: true,
                    },
                },
                moneyPhase: {
                    select: {
                        id: true,
                        campaign: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
                itemPhase: {
                    select: {
                        id: true,
                        campaign: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
        }),
        prismaClient.donation.count({ where }),
    ])

    return {
        donations: donations.map((d) => ({
            ...d,
            amount: d.amount.toString(),
            verifiedAmount: d.verifiedAmount
                ? d.verifiedAmount.toString()
                : null,
        })),
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    }
}
