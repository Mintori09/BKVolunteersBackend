import { Prisma, DonationStatus } from '@prisma/client'
import prismaClient from 'src/config/prisma'
import { CreateMoneyPhaseInput, UpdateMoneyPhaseInput, DonationFilterQuery } from './money-donation.types'

export const findMoneyPhaseById = async (id: number) => {
    return prismaClient.moneyDonationCampaign.findUnique({
        where: { id, deletedAt: null },
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

export const findMoneyPhaseByCampaignId = async (campaignId: string) => {
    return prismaClient.moneyDonationCampaign.findFirst({
        where: { campaignId, deletedAt: null },
    })
}

export const createMoneyPhase = async (
    campaignId: string,
    data: CreateMoneyPhaseInput & { qrImageUrl: string }
) => {
    return prismaClient.moneyDonationCampaign.create({
        data: {
            campaignId,
            targetAmount: data.targetAmount,
            qrImageUrl: data.qrImageUrl,
            bankAccountNo: data.bankAccountNo,
            bankAccountName: data.bankAccountName,
            bankCode: data.bankCode,
            startDate: data.startDate,
            endDate: data.endDate,
        },
    })
}

export const updateMoneyPhase = async (
    id: number,
    data: UpdateMoneyPhaseInput & { qrImageUrl?: string }
) => {
    return prismaClient.moneyDonationCampaign.update({
        where: { id },
        data: {
            targetAmount: data.targetAmount,
            bankAccountNo: data.bankAccountNo,
            bankAccountName: data.bankAccountName,
            bankCode: data.bankCode,
            qrImageUrl: data.qrImageUrl,
            startDate: data.startDate,
            endDate: data.endDate,
        },
    })
}

export const softDeleteMoneyPhase = async (id: number) => {
    return prismaClient.moneyDonationCampaign.update({
        where: { id },
        data: { deletedAt: new Date() },
    })
}

export const countDonationsByPhase = async (moneyPhaseId: number) => {
    return prismaClient.donation.count({
        where: { moneyPhaseId },
    })
}

export const getPhaseProgress = async (moneyPhaseId: number) => {
    const phase = await prismaClient.moneyDonationCampaign.findUnique({
        where: { id: moneyPhaseId },
    })

    if (!phase) return null

    const [totalDonations, verifiedDonations, pendingDonations, rejectedDonations, recentDonations] =
        await Promise.all([
            prismaClient.donation.count({ where: { moneyPhaseId } }),
            prismaClient.donation.count({ where: { moneyPhaseId, status: 'VERIFIED' } }),
            prismaClient.donation.count({ where: { moneyPhaseId, status: 'PENDING' } }),
            prismaClient.donation.count({ where: { moneyPhaseId, status: 'REJECTED' } }),
            prismaClient.donation.findMany({
                where: { moneyPhaseId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    amount: true,
                    status: true,
                    createdAt: true,
                    student: {
                        select: {
                            id: true,
                            mssv: true,
                            fullName: true,
                        },
                    },
                },
            }),
        ])

    const targetAmount = Number(phase.targetAmount)
    const currentAmount = Number(phase.currentAmount)
    const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0

    return {
        phaseId: phase.id,
        targetAmount: phase.targetAmount.toString(),
        currentAmount: phase.currentAmount.toString(),
        percentage: Math.round(percentage * 100) / 100,
        totalDonations,
        verifiedDonations,
        pendingDonations,
        rejectedDonations,
        recentDonations,
    }
}

export const findDonationsByPhase = async (
    moneyPhaseId: number,
    query: DonationFilterQuery
) => {
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const skip = (page - 1) * limit

    const where: Prisma.DonationWhereInput = {
        moneyPhaseId,
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
                student: {
                    select: {
                        id: true,
                        mssv: true,
                        fullName: true,
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
            verifiedAmount: d.verifiedAmount ? d.verifiedAmount.toString() : null,
        })),
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    }
}
