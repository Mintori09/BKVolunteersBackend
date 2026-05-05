import prismaClient from 'src/config/prisma'

const activeCampaignWhere = {
    deletedAt: null,
} as const

const countCampaignsByStatus = async () => {
    const [draft, pending, active, rejected, completed, cancelled] =
        await Promise.all([
            prismaClient.campaign.count({
                where: { ...activeCampaignWhere, status: 'DRAFT' },
            }),
            prismaClient.campaign.count({
                where: { ...activeCampaignWhere, status: 'PENDING' },
            }),
            prismaClient.campaign.count({
                where: { ...activeCampaignWhere, status: 'ACTIVE' },
            }),
            prismaClient.campaign.count({
                where: { ...activeCampaignWhere, status: 'REJECTED' },
            }),
            prismaClient.campaign.count({
                where: { ...activeCampaignWhere, status: 'COMPLETED' },
            }),
            prismaClient.campaign.count({
                where: { ...activeCampaignWhere, status: 'CANCELLED' },
            }),
        ])

    return {
        DRAFT: draft,
        PENDING: pending,
        ACTIVE: active,
        REJECTED: rejected,
        COMPLETED: completed,
        CANCELLED: cancelled,
    }
}

export const getSystemStatistics = async () => {
    const [
        totalStudents,
        totalUsers,
        totalClubs,
        totalCampaigns,
        campaignsByStatus,
        verifiedDonationAggregate,
    ] = await Promise.all([
        prismaClient.student.count(),
        prismaClient.user.count(),
        prismaClient.club.count(),
        prismaClient.campaign.count({ where: activeCampaignWhere }),
        countCampaignsByStatus(),
        prismaClient.donation.aggregate({
            where: { status: 'VERIFIED' },
            _sum: { verifiedAmount: true },
        }),
    ])

    return {
        totalStudents,
        totalUsers,
        totalClubs,
        totalCampaigns,
        campaignsByStatus,
        totalVerifiedDonationAmount: Number(
            verifiedDonationAggregate._sum.verifiedAmount || 0
        ),
    }
}
