import { prismaClient } from 'src/config'
import type { SchoolOverviewQuery } from './types'

type SchoolOverviewCampaign = {
    id: bigint
    status: string
    organizationId: bigint
    organization: {
        id: bigint
        code: string
        name: string
    }
    modules: Array<{
        type: string
    }>
}

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
                status: 'RECEIVED',
            },
            _sum: { receivedQuantity: true },
        }),
        prismaClient.eventRegistration.count({ where: { campaignId } }),
        prismaClient.eventRegistration.aggregate({
            where: { campaignId, status: 'COMPLETED' },
            _sum: { hours: true },
            _count: { id: true },
        }),
        prismaClient.certificate.count({
            where: { campaignId, status: { in: ['READY', 'SIGNED'] } },
        }),
    ])
}

export const getCampaignReconciliationStats = async (campaignId: bigint) => {
    return Promise.all([
        prismaClient.paymentTransaction.count({ where: { campaignId } }),
        prismaClient.paymentTransaction.count({
            where: { campaignId, matchStatus: 'MATCHED' },
        }),
        prismaClient.paymentTransaction.aggregate({
            where: { campaignId },
            _sum: { amount: true },
        }),
        prismaClient.paymentTransaction.aggregate({
            where: { campaignId, matchStatus: 'MATCHED' },
            _sum: { amount: true },
        }),
        prismaClient.moneyDonation.count({
            where: { campaignId, status: 'PENDING' },
        }),
        prismaClient.moneyDonation.count({
            where: { campaignId, status: 'MATCHED' },
        }),
        prismaClient.moneyDonation.count({
            where: { campaignId, status: 'VERIFIED' },
        }),
        prismaClient.moneyDonation.count({
            where: { campaignId, status: 'REJECTED' },
        }),
        prismaClient.moneyDonation.aggregate({
            where: { campaignId, status: 'VERIFIED' },
            _sum: { amount: true },
        }),
    ])
}

const buildCampaignWhere = (query?: SchoolOverviewQuery) => ({
    deletedAt: null,
    ...(query?.organization_id
        ? { organizationId: BigInt(query.organization_id) }
        : {}),
    ...(query?.status ? { status: query.status } : {}),
    ...(query?.module_type
        ? {
              modules: {
                  some: {
                      deletedAt: null,
                      type: query.module_type,
                  },
              },
          }
        : {}),
    ...(query?.from || query?.to
        ? {
              AND: [
                  ...(query.from
                      ? [{ endAt: { gte: new Date(query.from) } }]
                      : []),
                  ...(query.to
                      ? [{ startAt: { lte: new Date(query.to) } }]
                      : []),
              ],
          }
        : {}),
})

const getScopedCampaigns = async (query?: SchoolOverviewQuery) =>
    prismaClient.campaign.findMany({
        where: buildCampaignWhere(query),
        select: {
            id: true,
            status: true,
            organizationId: true,
            organization: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                },
            },
            modules: {
                where: { deletedAt: null },
                select: {
                    type: true,
                },
            },
        },
    }) as Promise<SchoolOverviewCampaign[]>

const sumVerifiedMoneyAmount = async (campaignIds: bigint[]) => {
    if (campaignIds.length === 0) {
        return 0
    }

    const result = await prismaClient.moneyDonation.aggregate({
        where: {
            campaignId: { in: campaignIds },
            status: 'VERIFIED',
        },
        _sum: { amount: true },
    })

    return Number(result._sum.amount ?? 0)
}

const sumReceivedItemQuantity = async (campaignIds: bigint[]) => {
    if (campaignIds.length === 0) {
        return 0
    }

    const result = await prismaClient.itemPledge.aggregate({
        where: {
            campaignId: { in: campaignIds },
            status: 'RECEIVED',
        },
        _sum: { receivedQuantity: true },
    })

    return result._sum.receivedQuantity ?? 0
}

const getCompletedEventStats = async (campaignIds: bigint[]) => {
    if (campaignIds.length === 0) {
        return {
            completedRegistrations: 0,
            completedHours: 0,
        }
    }

    const result = await prismaClient.eventRegistration.aggregate({
        where: {
            campaignId: { in: campaignIds },
            status: 'COMPLETED',
        },
        _sum: { hours: true },
        _count: { id: true },
    })

    return {
        completedRegistrations: result._count.id ?? 0,
        completedHours: Number(result._sum.hours ?? 0),
    }
}

const countIssuedCertificates = async (campaignIds: bigint[]) => {
    if (campaignIds.length === 0) {
        return 0
    }

    return prismaClient.certificate.count({
        where: {
            campaignId: { in: campaignIds },
            status: { in: ['READY', 'SIGNED'] },
        },
    })
}

export const getSchoolOverviewStats = async (query?: SchoolOverviewQuery) => {
    const campaigns = await getScopedCampaigns(query)
    const campaignIds = campaigns.map((item) => item.id)
    const organizationCampaigns = new Map<string, SchoolOverviewCampaign[]>()
    const organizationIds = new Set<string>()
    const studentIds = new Set<string>()

    campaigns.forEach((campaign) => {
        const organizationId = campaign.organizationId.toString()
        organizationIds.add(organizationId)
        if (!organizationCampaigns.has(organizationId)) {
            organizationCampaigns.set(organizationId, [])
        }
        organizationCampaigns.get(organizationId)!.push(campaign)
    })

    const [
        totalMoneyDonations,
        donationStudents,
        itemStudents,
        eventStudents,
        organizationBreakdown,
    ] = await Promise.all([
        sumVerifiedMoneyAmount(campaignIds),
        campaignIds.length === 0
            ? Promise.resolve([])
            : prismaClient.moneyDonation.findMany({
                  where: {
                      campaignId: { in: campaignIds },
                      status: 'VERIFIED',
                  },
                  select: { studentId: true },
                  distinct: ['studentId'],
              }),
        campaignIds.length === 0
            ? Promise.resolve([])
            : prismaClient.itemPledge.findMany({
                  where: {
                      campaignId: { in: campaignIds },
                      status: 'RECEIVED',
                  },
                  select: { studentId: true },
                  distinct: ['studentId'],
              }),
        campaignIds.length === 0
            ? Promise.resolve([])
            : prismaClient.eventRegistration.findMany({
                  where: {
                      campaignId: { in: campaignIds },
                      status: 'COMPLETED',
                  },
                  select: { studentId: true },
                  distinct: ['studentId'],
              }),
        Promise.all(
            Array.from(organizationCampaigns.values()).map(
                async (organizationScopedCampaigns) => {
                    const organization = organizationScopedCampaigns[0]!.organization
                    const scopedCampaignIds = organizationScopedCampaigns.map(
                        (campaign) => campaign.id
                    )
                    const [
                        verifiedMoneyAmount,
                        receivedItemQuantity,
                        completedEventStats,
                        issuedCertificates,
                    ] = await Promise.all([
                        sumVerifiedMoneyAmount(scopedCampaignIds),
                        sumReceivedItemQuantity(scopedCampaignIds),
                        getCompletedEventStats(scopedCampaignIds),
                        countIssuedCertificates(scopedCampaignIds),
                    ])

                    return {
                        organization_id: Number(organization.id),
                        organization_name: organization.name,
                        organization_code: organization.code,
                        campaign_count: organizationScopedCampaigns.length,
                        verified_money_amount: verifiedMoneyAmount,
                        received_item_quantity: receivedItemQuantity,
                        completed_event_registrations:
                            completedEventStats.completedRegistrations,
                        completed_event_hours:
                            completedEventStats.completedHours,
                        issued_certificates: issuedCertificates,
                    }
                }
            )
        ),
    ])

    donationStudents.forEach((item) => studentIds.add(item.studentId.toString()))
    itemStudents.forEach((item) => studentIds.add(item.studentId.toString()))
    eventStudents.forEach((item) => studentIds.add(item.studentId.toString()))

    const moduleTypeCounts = new Map<'fundraising' | 'item_donation' | 'event', number>([
        ['fundraising', 0],
        ['item_donation', 0],
        ['event', 0],
    ])
    const statusCounts = new Map<string, number>()

    campaigns.forEach((campaign) => {
        const moduleTypes = new Set(
            campaign.modules
                .map((module) => module.type)
                .filter(
                    (type): type is 'fundraising' | 'item_donation' | 'event' =>
                        type === 'fundraising' ||
                        type === 'item_donation' ||
                        type === 'event'
                )
        )

        moduleTypes.forEach((type) => {
            moduleTypeCounts.set(type, (moduleTypeCounts.get(type) ?? 0) + 1)
        })

        statusCounts.set(
            campaign.status,
            (statusCounts.get(campaign.status) ?? 0) + 1
        )
    })

    return {
        totalCampaigns: campaigns.length,
        totalStudents: studentIds.size,
        totalOrganizations: organizationIds.size,
        totalMoneyDonations,
        organizationBreakdown: organizationBreakdown.sort(
            (left, right) => right.campaign_count - left.campaign_count
        ),
        moduleBreakdown: Array.from(moduleTypeCounts.entries()).map(
            ([moduleType, campaignCount]) => ({
                module_type: moduleType,
                campaign_count: campaignCount,
            })
        ),
        statusBreakdown: Array.from(statusCounts.entries())
            .map(([status, campaignCount]) => ({
                status,
                campaign_count: campaignCount,
            }))
            .sort((left, right) => right.campaign_count - left.campaign_count),
    }
}
