import { prismaClient } from 'src/config'

export const findCampaignById = async (campaignId: bigint) => {
    return prismaClient.campaign.findUnique({
        where: { id: campaignId },
        include: {
            modules: {
                where: { deletedAt: null },
                select: { id: true, type: true, status: true },
            },
        },
    })
}

export const getCampaignStats = async (campaignId: bigint) => {
    return Promise.all([
        prismaClient.moneyDonation.aggregate({
            where: { campaignId, status: 'VERIFIED' },
            _sum: { amount: true },
        }),
        prismaClient.moneyDonation.count({ where: { campaignId } }),
        prismaClient.moneyDonation.count({
            where: { campaignId, status: 'VERIFIED' },
        }),
        prismaClient.itemPledge.aggregate({
            where: {
                campaignId,
                status: { in: ['CONFIRMED', 'RECEIVED'] },
            },
            _sum: { quantity: true },
        }),
        prismaClient.eventRegistration.count({ where: { campaignId } }),
        prismaClient.eventRegistration.count({
            where: { campaignId, status: 'APPROVED' },
        }),
        prismaClient.certificate.count({ where: { campaignId } }),
    ])
}

export const getSchoolOverviewStats = async () => {
    return Promise.all([
        prismaClient.campaign.count({ where: { deletedAt: null } }),
        prismaClient.student.count({ where: { deletedAt: null } }),
        prismaClient.organization.count({ where: { deletedAt: null } }),
        prismaClient.moneyDonation.aggregate({ _sum: { amount: true } }),
    ])
}
