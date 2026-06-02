import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import * as reportsRepository from '../reports.repository'
import * as reportsService from '../reports.service'

jest.mock('../reports.repository')

describe('reports.service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('returns reconciliation summary for owner organization', async () => {
        ;(reportsRepository.findCampaignById as jest.Mock).mockResolvedValue({
            id: 101n,
            title: 'Mua he xanh 2026',
            slug: 'mua-he-xanh-2026',
            status: 'PUBLISHED',
            organizationId: 12n,
            deletedAt: null,
            modules: [],
        })
        ;(
            reportsRepository.getCampaignReconciliationStats as jest.Mock
        ).mockResolvedValue([
            15,
            12,
            { _sum: { amount: 18000000 } },
            { _sum: { amount: 15000000 } },
            2,
            4,
            10,
            1,
            { _sum: { amount: 12000000 } },
        ])

        const result = await reportsService.getCampaignReconciliationReport(
            '101',
            {
                userId: '5',
                accountType: 'OPERATOR',
                role: 'CLB',
                organizationId: '12',
            } as any
        )

        expect(result).toEqual({
            campaign: {
                id: 101,
                title: 'Mua he xanh 2026',
                slug: 'mua-he-xanh-2026',
                status: 'PUBLISHED',
                organization_id: 12,
            },
            reconciliation: {
                matched_transactions: 12,
                unmatched_transactions: 3,
                total_transaction_amount: 18000000,
                matched_transaction_amount: 15000000,
                unmatched_transaction_amount: 3000000,
                pending_donations: 2,
                matched_donations: 4,
                verified_donations: 10,
                rejected_donations: 1,
                verified_amount: 12000000,
                amount_gap_vs_verified: 3000000,
            },
        })
    })

    it('blocks reconciliation report outside owner scope', async () => {
        ;(reportsRepository.findCampaignById as jest.Mock).mockResolvedValue({
            id: 101n,
            title: 'Mua he xanh 2026',
            slug: 'mua-he-xanh-2026',
            status: 'PUBLISHED',
            organizationId: 12n,
            deletedAt: null,
            modules: [],
        })

        await expect(
            reportsService.getCampaignReconciliationReport('101', {
                userId: '5',
                accountType: 'OPERATOR',
                role: 'CLB',
                organizationId: '99',
            } as any)
        ).rejects.toMatchObject({
            statusCode: 403,
        })
    })

    it('allows school approver to view canonical campaign report', async () => {
        ;(reportsRepository.findCampaignById as jest.Mock).mockResolvedValue({
            id: 101n,
            title: 'Mua he xanh 2026',
            slug: 'mua-he-xanh-2026',
            status: 'ONGOING',
            organizationId: 12n,
            deletedAt: null,
            modules: [{ id: 401n, type: 'FUNDRAISING', status: 'OPEN' }],
        })
        ;(reportsRepository.getCampaignStats as jest.Mock).mockResolvedValue([
            { _sum: { amount: 9000000 } },
            14,
            11,
            { _sum: { receivedQuantity: 80 } },
            32,
            { _count: { id: 18 }, _sum: { hours: 42.5 } },
            12,
        ])

        const result = await reportsService.getCampaignReport('101', {
            userId: '9',
            accountType: 'OPERATOR',
            role: 'DOANTRUONG',
        } as any)

        expect(result.fundraising).toEqual({
            total_verified_amount: 9000000,
            total_donations: 14,
            verified_donations: 11,
        })
        expect(result.item_donations).toEqual({
            received_quantity: 80,
        })
        expect(result.events).toEqual({
            registrations: 32,
            completed_registrations: 18,
            completed_hours: 42.5,
        })
        expect(result.certificates).toEqual({
            issued_total: 12,
        })
        expect(result.modules).toEqual([
            { id: 401, type: 'FUNDRAISING', status: 'OPEN' },
        ])
    })

    it('blocks school overview for non-DOANTRUONG operator', async () => {
        await expect(
            reportsService.getSchoolOverview(
                {},
                {
                    userId: '9',
                    accountType: 'OPERATOR',
                    role: 'CLB',
                } as any
            )
        ).rejects.toMatchObject({
            statusCode: 403,
        })
    })

    it('returns school overview with canonical breakdowns and applied filters', async () => {
        ;(reportsRepository.getSchoolOverviewStats as jest.Mock).mockResolvedValue({
            totalCampaigns: 3,
            totalStudents: 9,
            totalOrganizations: 2,
            totalMoneyDonations: 12000000,
            organizationBreakdown: [
                {
                    organization_id: 12,
                    organization_name: 'CLB Tinh nguyen CNTT',
                    organization_code: 'CLB-CNTT',
                    campaign_count: 2,
                    verified_money_amount: 8000000,
                    received_item_quantity: 24,
                    completed_event_registrations: 16,
                    completed_event_hours: 48,
                    issued_certificates: 10,
                },
            ],
            moduleBreakdown: [
                { module_type: 'fundraising', campaign_count: 2 },
                { module_type: 'item_donation', campaign_count: 1 },
                { module_type: 'event', campaign_count: 3 },
            ],
            statusBreakdown: [
                { status: 'PUBLISHED', campaign_count: 2 },
                { status: 'ONGOING', campaign_count: 1 },
            ],
        })

        const result = await reportsService.getSchoolOverview(
            {
                from: '2026-05-01T00:00:00.000Z',
                to: '2026-05-31T23:59:59.000Z',
                organization_id: '12',
                module_type: 'event',
                status: 'PUBLISHED',
            },
            {
                userId: '9',
                accountType: 'OPERATOR',
                role: 'DOANTRUONG',
            } as any
        )

        expect(result).toEqual({
            total_campaigns: 3,
            total_students: 9,
            total_organizations: 2,
            total_money_donations: 12000000,
            organization_breakdown: [
                {
                    organization_id: 12,
                    organization_name: 'CLB Tinh nguyen CNTT',
                    organization_code: 'CLB-CNTT',
                    campaign_count: 2,
                    verified_money_amount: 8000000,
                    received_item_quantity: 24,
                    completed_event_registrations: 16,
                    completed_event_hours: 48,
                    issued_certificates: 10,
                },
            ],
            module_breakdown: [
                { module_type: 'fundraising', campaign_count: 2 },
                { module_type: 'item_donation', campaign_count: 1 },
                { module_type: 'event', campaign_count: 3 },
            ],
            status_breakdown: [
                { status: 'PUBLISHED', campaign_count: 2 },
                { status: 'ONGOING', campaign_count: 1 },
            ],
            filters_applied: {
                from: '2026-05-01T00:00:00.000Z',
                to: '2026-05-31T23:59:59.000Z',
                organization_id: 12,
                module_type: 'event',
                status: 'PUBLISHED',
            },
        })
        expect(reportsRepository.getSchoolOverviewStats).toHaveBeenCalledWith({
            from: '2026-05-01T00:00:00.000Z',
            to: '2026-05-31T23:59:59.000Z',
            organization_id: '12',
            module_type: 'event',
            status: 'PUBLISHED',
        })
    })
})
