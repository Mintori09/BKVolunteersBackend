import { HttpStatus } from 'src/common/constants'
import { serializeId } from 'src/common/serializers'
import { ApiError } from 'src/utils/ApiError'
import * as reportsRepository from './reports.repository'
import { CampaignReportOutput, SchoolOverviewOutput } from './types'

export const getCampaignReport = async (
    campaignIdRaw: string
): Promise<CampaignReportOutput> => {
    const campaignId = BigInt(campaignIdRaw)
    const campaign = await reportsRepository.findCampaignById(campaignId)

    if (!campaign || campaign.deletedAt) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Campaign not found')
    }

    const [
        donationAgg,
        donationCount,
        verifiedDonationCount,
        itemPledgeAgg,
        eventRegistrationCount,
        eventApprovedCount,
        certificateCount,
    ] = await reportsRepository.getCampaignStats(campaignId)

    return {
        campaign: {
            id: serializeId(campaign.id)!,
            title: campaign.title,
            slug: campaign.slug,
            status: campaign.status,
        },
        modules: campaign.modules.map((module) => ({
            id: serializeId(module.id)!,
            type: module.type,
            status: module.status,
        })),
        fundraising: {
            total_verified_amount: Number(donationAgg._sum.amount ?? 0),
            total_donations: donationCount,
            verified_donations: verifiedDonationCount,
        },
        item_donations: {
            confirmed_quantity: itemPledgeAgg._sum.quantity ?? 0,
        },
        events: {
            registrations: eventRegistrationCount,
            approved_registrations: eventApprovedCount,
        },
        certificates: {
            total: certificateCount,
        },
    }
}

export const getSchoolOverview = async (): Promise<SchoolOverviewOutput> => {
    const [
        totalCampaigns,
        totalStudents,
        totalOrganizations,
        totalMoneyDonations,
    ] = await reportsRepository.getSchoolOverviewStats()

    return {
        total_campaigns: totalCampaigns,
        total_students: totalStudents,
        total_organizations: totalOrganizations,
        total_money_donations: Number(totalMoneyDonations._sum.amount ?? 0),
    }
}
