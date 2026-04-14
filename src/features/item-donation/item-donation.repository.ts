import { prismaClient } from 'src/config'
import { CreateItemDonationInput, GetItemDonationsQuery } from './types'

export const findItemPhaseById = async (phaseId: number) => {
    return prismaClient.itemDonationCampaign.findUnique({
        where: { id: phaseId },
        include: { campaign: true },
    })
}

export const createItemDonation = async (
    studentId: string,
    data: CreateItemDonationInput
) => {
    return prismaClient.donation.create({
        data: {
            studentId,
            itemPhaseId: data.itemPhaseId,
            itemDescription: data.itemDescription,
            proofImageUrl: data.proofImageUrl,
        },
    })
}

export const findDonationsByPhaseId = async (
    phaseId: number,
    query: GetItemDonationsQuery
) => {
    const { status, page = 1, limit = 10 } = query
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
        itemPhaseId: phaseId,
    }

    if (status) {
        where.status = status
    }

    const [items, total] = await Promise.all([
        prismaClient.donation.findMany({
            where,
            include: {
                student: {
                    select: {
                        id: true,
                        mssv: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prismaClient.donation.count({ where }),
    ])

    return {
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    }
}
