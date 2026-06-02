import { describe, expect, it, jest, beforeEach } from '@jest/globals'
import * as campaignRepository from '../campaign.repository'
import * as campaignService from '../campaign.service'

jest.mock('../campaign.repository')

describe('campaign.service getCampaigns', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('forces organization scope for non-approver operators', async () => {
        ;(campaignRepository.findCampaigns as jest.Mock).mockResolvedValue({
            items: [],
            meta: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 1,
            },
        })

        await campaignService.getCampaigns(
            { page: 1, limit: 10, organization_id: '99' },
            {
                userId: '7',
                accountType: 'OPERATOR',
                role: 'CLB',
                organizationId: '5',
            } as any
        )

        expect(campaignRepository.findCampaigns).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    organizationId: 5n,
                }),
            })
        )
    })

    it('passes text search filter into campaign query', async () => {
        ;(campaignRepository.findCampaigns as jest.Mock).mockResolvedValue({
            items: [],
            meta: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 1,
            },
        })

        await campaignService.getCampaigns(
            { page: 1, limit: 10, q: 'mua he xanh' },
            {
                userId: '1',
                accountType: 'OPERATOR',
                role: 'DOANTRUONG',
            } as any
        )

        expect(campaignRepository.findCampaigns).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    OR: [
                        { title: { contains: 'mua he xanh' } },
                        { summary: { contains: 'mua he xanh' } },
                        { slug: { contains: 'mua he xanh' } },
                        { organization: { name: { contains: 'mua he xanh' } } },
                    ],
                }),
            })
        )
    })
})

describe('campaign.service deleteCampaign', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('soft deletes editable campaign and writes audit trail', async () => {
        ;(campaignRepository.findCampaignById as jest.Mock).mockResolvedValue({
            id: 15n,
            organizationId: 8n,
            status: 'DRAFT',
            organization: {
                id: 8n,
                status: 'ACTIVE',
            },
        })
        ;(campaignRepository.softDeleteCampaign as jest.Mock).mockResolvedValue({})
        ;(campaignRepository.createActivity as jest.Mock).mockResolvedValue({})
        ;(campaignRepository.createAuditLog as jest.Mock).mockResolvedValue({})

        await campaignService.deleteCampaign('15', {
            userId: '21',
            accountType: 'OPERATOR',
            role: 'CLB',
            organizationId: '8',
        } as any)

        expect(campaignRepository.softDeleteCampaign).toHaveBeenCalledWith('15')
        expect(campaignRepository.createActivity).toHaveBeenCalledWith(
            expect.objectContaining({
                campaignId: 15n,
                actorId: 21n,
                activityType: 'CAMPAIGN_SOFT_DELETED',
            })
        )
        expect(campaignRepository.createAuditLog).toHaveBeenCalledWith(
            expect.objectContaining({
                actorId: 21n,
                action: 'CAMPAIGN_SOFT_DELETED',
                entityId: 15n,
            })
        )
    })

    it('rejects deleting non-editable campaign status', async () => {
        ;(campaignRepository.findCampaignById as jest.Mock).mockResolvedValue({
            id: 15n,
            organizationId: 8n,
            status: 'SUBMITTED',
            organization: {
                id: 8n,
                status: 'ACTIVE',
            },
        })

        await expect(
            campaignService.deleteCampaign('15', {
                userId: '21',
                accountType: 'OPERATOR',
                role: 'CLB',
                organizationId: '8',
            } as any)
        ).rejects.toMatchObject({
            statusCode: 409,
        })

        expect(campaignRepository.softDeleteCampaign).not.toHaveBeenCalled()
    })
})

describe('campaign.service organization guards', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('rejects creating campaign for inactive organization', async () => {
        ;(campaignRepository.findOrganizationById as jest.Mock).mockResolvedValue({
            id: 8n,
            name: 'CLB CNTT',
            status: 'INACTIVE',
        })

        await expect(
            campaignService.createCampaign(
                {
                    title: 'Campaign inactive org',
                    summary: 'summary',
                    description: 'description',
                    start_at: new Date('2026-05-22T00:00:00.000Z'),
                    end_at: new Date('2026-05-24T00:00:00.000Z'),
                    scope_type: 'PUBLIC',
                    organization_id: 8,
                } as any,
                {
                    userId: '21',
                    accountType: 'OPERATOR',
                    role: 'CLB',
                    organizationId: '8',
                } as any
            )
        ).rejects.toMatchObject({
            statusCode: 409,
        })

        expect(campaignRepository.createCampaign).not.toHaveBeenCalled()
    })

    it('rejects creating campaign for another organization by org operator', async () => {
        await expect(
            campaignService.createCampaign(
                {
                    title: 'Cross org campaign',
                    summary: 'summary',
                    description: 'description',
                    start_at: new Date('2026-05-22T00:00:00.000Z'),
                    end_at: new Date('2026-05-24T00:00:00.000Z'),
                    scope_type: 'PUBLIC',
                    organization_id: 9,
                } as any,
                {
                    userId: '21',
                    accountType: 'OPERATOR',
                    role: 'CLB',
                    organizationId: '8',
                } as any
            )
        ).rejects.toMatchObject({
            statusCode: 403,
        })

        expect(campaignRepository.findOrganizationById).not.toHaveBeenCalled()
    })

    it('rejects updating campaign when organization is inactive', async () => {
        ;(campaignRepository.findCampaignById as jest.Mock).mockResolvedValue({
            id: 15n,
            organizationId: 8n,
            status: 'DRAFT',
            organization: {
                id: 8n,
                status: 'INACTIVE',
            },
        })

        await expect(
            campaignService.updateCampaign(
                '15',
                { title: 'Updated title' } as any,
                {
                    userId: '21',
                    accountType: 'OPERATOR',
                    role: 'CLB',
                    organizationId: '8',
                } as any
            )
        ).rejects.toMatchObject({
            statusCode: 409,
        })

        expect(campaignRepository.updateCampaign).not.toHaveBeenCalled()
    })

    it('rejects creating module when organization is inactive', async () => {
        ;(campaignRepository.findCampaignById as jest.Mock).mockResolvedValue({
            id: 15n,
            organizationId: 8n,
            status: 'DRAFT',
            organization: {
                id: 8n,
                status: 'INACTIVE',
            },
        })

        await expect(
            campaignService.createCampaignModule(
                '15',
                {
                    type: 'event',
                    title: 'Event module',
                    start_at: new Date('2026-05-22T00:00:00.000Z'),
                    end_at: new Date('2026-05-23T00:00:00.000Z'),
                } as any,
                {
                    userId: '21',
                    accountType: 'OPERATOR',
                    role: 'CLB',
                    organizationId: '8',
                } as any
            )
        ).rejects.toMatchObject({
            statusCode: 409,
        })

        expect(campaignRepository.createModule).not.toHaveBeenCalled()
    })
})
