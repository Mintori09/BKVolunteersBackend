import { prismaClient } from 'src/config'

const publicCampaignWhere = {
    status: { in: ['PUBLISHED', 'ONGOING'] as string[] },
}

export const findPublicCampaigns = async (page: number, limit: number) => {
    const skip = (page - 1) * limit
    return Promise.all([
        prismaClient.campaign.findMany({
            where: publicCampaignWhere,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                slug: true,
                title: true,
                summary: true,
                description: true,
                coverImageUrl: true,
                beneficiary: true,
                scopeType: true,
                startAt: true,
                endAt: true,
                status: true,
            },
        }),
        prismaClient.campaign.count({ where: publicCampaignWhere }),
    ])
}

export const findPublicCampaignBySlug = async (slug: string) => {
    return prismaClient.campaign.findUnique({
        where: { slug },
        select: {
            id: true,
            slug: true,
            title: true,
            summary: true,
            description: true,
            coverImageUrl: true,
            beneficiary: true,
            scopeType: true,
            startAt: true,
            endAt: true,
            status: true,
        },
    })
}

export const findCertificateByNumber = async (certificateNo: string) => {
    return prismaClient.certificate.findUnique({
        where: { certificateNo },
    })
}
