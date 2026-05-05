import { Prisma, CampaignStatus } from '@prisma/client'
import prismaClient from 'src/config/prisma'
import {
    CreateCampaignInput,
    UpdateCampaignInput,
    CampaignFilterQuery,
} from './types'

export const createCampaign = async (
    data: CreateCampaignInput & { creatorId: string }
) => {
    return prismaClient.campaign.create({
        data: {
            title: data.title,
            description: data.description,
            scope: data.scope,
            status: 'DRAFT',
            creatorId: data.creatorId,
        },
        include: {
            creator: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                },
            },
        },
    })
}

export const findCampaignById = async (id: string) => {
    return prismaClient.campaign.findUnique({
        where: { id },
        include: {
            creator: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    facultyId: true,
                },
            },
            approver: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                },
            },
            moneyPhase: true,
            itemPhase: true,
            eventPhase: true,
        },
    })
}

export const updateCampaign = async (id: string, data: UpdateCampaignInput) => {
    return prismaClient.campaign.update({
        where: { id },
        data: {
            title: data.title,
            description: data.description,
        },
        include: {
            creator: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                },
            },
        },
    })
}

export const deleteCampaign = async (id: string) => {
    return prismaClient.campaign.delete({
        where: { id },
    })
}

export const updateCampaignStatus = async (
    id: string,
    status: CampaignStatus,
    options?: {
        approverId?: string
        adminComment?: string
    }
) => {
    return prismaClient.campaign.update({
        where: { id },
        data: {
            status,
            approverId: options?.approverId,
            adminComment: options?.adminComment,
        },
        include: {
            creator: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                },
            },
            approver: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                },
            },
        },
    })
}

export const updatePlanFileUrl = async (id: string, planFileUrl: string) => {
    return prismaClient.campaign.update({
        where: { id },
        data: { planFileUrl },
    })
}

export const updateBudgetFileUrl = async (
    id: string,
    budgetFileUrl: string
) => {
    return prismaClient.campaign.update({
        where: { id },
        data: { budgetFileUrl },
    })
}

export const findCampaignsWithFilter = async (query: CampaignFilterQuery) => {
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const skip = (page - 1) * limit

    const where: Prisma.CampaignWhereInput = {
        deletedAt: null,
    }

    if (query.status) {
        where.status = query.status
    }
    if (query.scope) {
        where.scope = query.scope
    }
    if (query.creatorId) {
        where.creatorId = query.creatorId
    }

    const [campaigns, total] = await Promise.all([
        prismaClient.campaign.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        role: true,
                    },
                },
            },
        }),
        prismaClient.campaign.count({ where }),
    ])

    return {
        campaigns,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    }
}

export const findAvailableCampaigns = async (
    userRole: string,
    userFacultyId?: string | null,
    page: number = 1,
    limit: number = 10
) => {
    const skip = (page - 1) * limit

    const where: Prisma.CampaignWhereInput = {
        status: 'ACTIVE',
        deletedAt: null,
    }

    if (userRole !== 'DOANTRUONG' && userFacultyId) {
        where.OR = [{ scope: 'TRUONG' }, { scope: 'KHOA' }]
    }

    const [campaigns, total] = await Promise.all([
        prismaClient.campaign.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                creator: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        role: true,
                    },
                },
                moneyPhase: true,
                itemPhase: true,
                eventPhase: true,
            },
        }),
        prismaClient.campaign.count({ where }),
    ])

    return {
        campaigns,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    }
}

export const softDeleteCampaign = async (id: string) => {
    return prismaClient.campaign.update({
        where: { id },
        data: { deletedAt: new Date() },
    })
}

export const getCampaignStatistics = async (campaignId: string) => {
    const [
        verifiedMoneyAggregate,
        pendingMoneyDonations,
        verifiedMoneyDonations,
        rejectedMoneyDonations,
        pendingItemDonations,
        verifiedItemDonations,
        rejectedItemDonations,
        pendingParticipants,
        approvedParticipants,
        rejectedParticipants,
        checkedInParticipants,
        totalEvents,
    ] = await Promise.all([
        prismaClient.donation.aggregate({
            where: {
                status: 'VERIFIED',
                moneyPhase: {
                    is: {
                        campaignId,
                    },
                },
            },
            _sum: {
                verifiedAmount: true,
            },
        }),
        prismaClient.donation.count({
            where: {
                status: 'PENDING',
                moneyPhase: { is: { campaignId } },
            },
        }),
        prismaClient.donation.count({
            where: {
                status: 'VERIFIED',
                moneyPhase: { is: { campaignId } },
            },
        }),
        prismaClient.donation.count({
            where: {
                status: 'REJECTED',
                moneyPhase: { is: { campaignId } },
            },
        }),
        prismaClient.donation.count({
            where: {
                status: 'PENDING',
                itemPhase: { is: { campaignId } },
            },
        }),
        prismaClient.donation.count({
            where: {
                status: 'VERIFIED',
                itemPhase: { is: { campaignId } },
            },
        }),
        prismaClient.donation.count({
            where: {
                status: 'REJECTED',
                itemPhase: { is: { campaignId } },
            },
        }),
        prismaClient.participant.count({
            where: {
                status: 'PENDING',
                event: { is: { campaignId } },
            },
        }),
        prismaClient.participant.count({
            where: {
                status: 'APPROVED',
                event: { is: { campaignId } },
            },
        }),
        prismaClient.participant.count({
            where: {
                status: 'REJECTED',
                event: { is: { campaignId } },
            },
        }),
        prismaClient.participant.count({
            where: {
                isCheckedIn: true,
                event: { is: { campaignId } },
            },
        }),
        prismaClient.eventCampaign.count({
            where: { campaignId },
        }),
    ])

    return {
        totalVerifiedAmount: Number(
            verifiedMoneyAggregate._sum.verifiedAmount || 0
        ),
        moneyDonations: {
            pending: pendingMoneyDonations,
            verified: verifiedMoneyDonations,
            rejected: rejectedMoneyDonations,
        },
        itemDonations: {
            pending: pendingItemDonations,
            verified: verifiedItemDonations,
            rejected: rejectedItemDonations,
        },
        participants: {
            pending: pendingParticipants,
            approved: approvedParticipants,
            rejected: rejectedParticipants,
            checkedIn: checkedInParticipants,
        },
        totalEvents,
    }
}
