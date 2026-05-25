import { HttpStatus } from 'src/common/constants'
import { serializeId } from 'src/common/serializers'
import { ApiError } from 'src/utils/ApiError'
import type { JwtPayload } from 'jsonwebtoken'
import * as reportsRepository from './reports.repository'
import {
    CampaignReconciliationOutput,
    CampaignReportOutput,
    SchoolOverviewOutput,
    SchoolOverviewQuery,
} from './types'

const assertOperator = (payload?: JwtPayload | null) => {
    if (!payload?.userId || payload.accountType !== 'OPERATOR') {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản operator')
    }

    return payload
}

const assertCampaignReportScope = (
    campaign: Awaited<ReturnType<typeof reportsRepository.findCampaignById>>,
    payload?: JwtPayload | null
) => {
    const principal = assertOperator(payload)

    if (!campaign || campaign.deletedAt) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Campaign not found')
    }

    if (
        principal.role === 'DOANTRUONG' ||
        principal.role === 'LCD' ||
        (principal.organizationId &&
            String(campaign.organizationId) === principal.organizationId)
    ) {
        return campaign
    }

    throw new ApiError(
        HttpStatus.FORBIDDEN,
        'Không có quyền xem báo cáo chiến dịch này'
    )
}

export const getCampaignReport = async (
    campaignIdRaw: string,
    payload?: JwtPayload | null
): Promise<CampaignReportOutput> => {
    const campaignId = BigInt(campaignIdRaw)
    const campaign = await reportsRepository.findCampaignById(campaignId)
    const scopedCampaign = assertCampaignReportScope(campaign, payload)

    const [
        donationAgg,
        donationCount,
        verifiedDonationCount,
        itemPledgeAgg,
        eventRegistrationCount,
        completedEventAgg,
        certificateCount,
    ] = await reportsRepository.getCampaignStats(campaignId)

    return {
        campaign: {
            id: serializeId(scopedCampaign.id)!,
            title: scopedCampaign.title,
            slug: scopedCampaign.slug,
            status: scopedCampaign.status,
        },
        modules: scopedCampaign.modules.map((module) => ({
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
            received_quantity: itemPledgeAgg._sum.receivedQuantity ?? 0,
        },
        events: {
            registrations: eventRegistrationCount,
            completed_registrations: completedEventAgg._count.id ?? 0,
            completed_hours: Number(completedEventAgg._sum.hours ?? 0),
        },
        certificates: {
            issued_total: certificateCount,
        },
    }
}

export const getCampaignReconciliationReport = async (
    campaignIdRaw: string,
    payload?: JwtPayload | null
): Promise<CampaignReconciliationOutput> => {
    const campaignId = BigInt(campaignIdRaw)
    const campaign = await reportsRepository.findCampaignById(campaignId)
    const scopedCampaign = assertCampaignReportScope(campaign, payload)

    const [
        totalTransactions,
        matchedTransactions,
        totalTransactionAgg,
        matchedTransactionAgg,
        pendingDonations,
        matchedDonations,
        verifiedDonations,
        rejectedDonations,
        verifiedAmountAgg,
    ] = await reportsRepository.getCampaignReconciliationStats(campaignId)

    const totalTransactionAmount = Number(totalTransactionAgg._sum.amount ?? 0)
    const matchedTransactionAmount = Number(
        matchedTransactionAgg._sum.amount ?? 0
    )
    const verifiedAmount = Number(verifiedAmountAgg._sum.amount ?? 0)

    return {
        campaign: {
            id: serializeId(scopedCampaign.id)!,
            title: scopedCampaign.title,
            slug: scopedCampaign.slug,
            status: scopedCampaign.status,
            organization_id: serializeId(scopedCampaign.organizationId)!,
        },
        reconciliation: {
            matched_transactions: matchedTransactions,
            unmatched_transactions: totalTransactions - matchedTransactions,
            total_transaction_amount: totalTransactionAmount,
            matched_transaction_amount: matchedTransactionAmount,
            unmatched_transaction_amount:
                totalTransactionAmount - matchedTransactionAmount,
            pending_donations: pendingDonations,
            matched_donations: matchedDonations,
            verified_donations: verifiedDonations,
            rejected_donations: rejectedDonations,
            verified_amount: verifiedAmount,
            amount_gap_vs_verified:
                matchedTransactionAmount - verifiedAmount,
        },
    }
}

export const getSchoolOverview = async (
    query: SchoolOverviewQuery,
    payload?: JwtPayload | null
): Promise<SchoolOverviewOutput> => {
    const principal = assertOperator(payload)
    if (principal.role !== 'DOANTRUONG') {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Chỉ Đoàn trường được xem dashboard toàn trường'
        )
    }

    const {
        totalCampaigns,
        totalStudents,
        totalOrganizations,
        totalMoneyDonations,
        organizationBreakdown,
        moduleBreakdown,
        statusBreakdown,
    } = await reportsRepository.getSchoolOverviewStats(query)

    return {
        total_campaigns: totalCampaigns,
        total_students: totalStudents,
        total_organizations: totalOrganizations,
        total_money_donations: totalMoneyDonations,
        organization_breakdown: organizationBreakdown,
        module_breakdown: moduleBreakdown,
        status_breakdown: statusBreakdown,
        filters_applied: {
            ...(query.from ? { from: query.from } : {}),
            ...(query.to ? { to: query.to } : {}),
            ...(query.organization_id
                ? { organization_id: Number(query.organization_id) }
                : {}),
            ...(query.module_type ? { module_type: query.module_type } : {}),
            ...(query.status ? { status: query.status } : {}),
        },
    }
}
