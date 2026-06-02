import { Prisma } from '@prisma/client'
import { prismaClient } from 'src/config'
import { PublicCampaignListQuery } from './types'

const moduleTypeFromApi = (value: string) => {
    switch (value) {
        case 'fundraising':
            return 'fundraising'
        case 'item_donation':
            return 'item_donation'
        case 'event':
            return 'event'
        default:
            return value.toLowerCase()
    }
}

const publicCampaignSelect = {
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
    publishedAt: true,
    organization: {
        select: {
            id: true,
            code: true,
            name: true,
            type: true,
            logoUrl: true,
        },
    },
    modules: {
        where: { deletedAt: null },
        select: {
            id: true,
            type: true,
            title: true,
            description: true,
            status: true,
            startAt: true,
            endAt: true,
            settingsJson: true,
            moneyDonations: {
                where: { status: 'VERIFIED' },
                select: { amount: true },
            },
            itemTargets: {
                select: { targetQuantity: true, receivedQuantity: true },
            },
            eventRegistrations: {
                where: { status: { in: ['APPROVED', 'CHECKED_IN', 'COMPLETED'] } },
                select: { id: true },
            },
        },
        orderBy: { createdAt: 'asc' as const },
    },
} satisfies Prisma.CampaignSelect

const buildPublicWhere = (query: PublicCampaignListQuery): Prisma.CampaignWhereInput => ({
    deletedAt: null,
    status: query.status
        ? query.status
        : { in: ['PUBLISHED', 'ONGOING'] as string[] },
    ...(query.organization_id
        ? {
              organizationId: BigInt(query.organization_id),
          }
        : {}),
    ...(query.module_type
        ? {
              modules: {
                  some: { type: moduleTypeFromApi(query.module_type) },
              },
          }
        : {}),
    ...(query.q
        ? {
              OR: [
                  { title: { contains: query.q } },
                  { summary: { contains: query.q } },
                  { organization: { name: { contains: query.q } } },
              ],
          }
        : {}),
})

export const findPublicCampaigns = async (query: PublicCampaignListQuery) => {
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const skip = (page - 1) * limit
    const where = buildPublicWhere(query)

    return Promise.all([
        prismaClient.campaign.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: publicCampaignSelect,
        }),
        prismaClient.campaign.count({ where }),
    ])
}

export const findPublicCampaignBySlug = async (slug: string) => {
    return prismaClient.campaign.findFirst({
        where: {
            slug,
            deletedAt: null,
            status: { in: ['PUBLISHED', 'ONGOING'] },
        },
        select: publicCampaignSelect,
    })
}

export const findCertificateByNumber = async (certificateNo: string) => {
    return prismaClient.certificate.findUnique({
        where: { certificateNo },
        include: {
            student: { select: { fullName: true } },
            campaign: {
                select: {
                    title: true,
                    organization: { select: { name: true } },
                },
            },
        },
    })
}
