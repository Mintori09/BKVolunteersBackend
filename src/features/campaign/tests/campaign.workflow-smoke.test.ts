import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import * as campaignService from '../campaign.service'
import * as approvalsService from 'src/features/approvals/approvals.service'
import * as campaignRepository from '../campaign.repository'
import * as approvalsRepository from 'src/features/approvals/approvals.repository'
import * as publicService from 'src/features/public/public.service'
import * as publicRepository from 'src/features/public/public.repository'

jest.mock('src/config', () => ({
    prismaClient: {},
    config: {
        node_env: 'test',
    },
}))

jest.mock('../campaign.repository')
jest.mock('src/features/approvals/approvals.repository')
jest.mock('src/features/public/public.repository')

describe('campaign workflow smoke', () => {
    const approvalStatuses = ['SUBMITTED', 'PRE_APPROVED', 'REVISION_REQUIRED']
    const ownerPrincipal = {
        userId: '21',
        accountType: 'OPERATOR',
        role: 'CLB',
        organizationId: '8',
    } as any

    const reviewerPrincipal = {
        userId: '99',
        accountType: 'OPERATOR',
        role: 'DOANTRUONG',
    } as any

    const campaignState: {
        status: string
        approvedAt: Date | null
        publishedAt: Date | null
        approvedBy: bigint | null
        reviews: Array<any>
        activities: Array<any>
    } = {
        status: 'DRAFT',
        approvedAt: null,
        publishedAt: null,
        approvedBy: null,
        reviews: [],
        activities: [],
    }

    const buildCampaignRecord = () => ({
        id: 15n,
        organizationId: 8n,
        title: 'Chiến dịch mùa hè xanh',
        slug: 'chien-dich-mua-he-xanh',
        summary: 'Gây quỹ và tuyển tình nguyện viên',
        description: 'Smoke flow cho sprint 2',
        coverImageUrl: null,
        beneficiary: 'Sinh viên khó khăn',
        scopeType: 'PUBLIC',
        facultyId: null,
        startAt: new Date('2025-01-01T00:00:00.000Z'),
        endAt: new Date('2027-01-01T00:00:00.000Z'),
        status: campaignState.status,
        publishedAt: campaignState.publishedAt,
        approvedAt: campaignState.approvedAt,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-02T00:00:00.000Z'),
        organization: {
            id: 8n,
            code: 'CLB-ITV',
            name: 'CLB Tình nguyện CNTT',
            type: 'CLB',
            status: 'ACTIVE',
            logoUrl: null,
            facultyId: null,
        },
        faculty: null,
        creator: {
            id: 21n,
            email: 'owner@example.com',
            fullName: 'Org Owner',
            role: 'CLB',
        },
        approver: campaignState.approvedBy
            ? {
                  id: campaignState.approvedBy,
                  email: 'reviewer@example.com',
                  fullName: 'School Reviewer',
                  role: 'DOANTRUONG',
              }
            : null,
        modules: [
            {
                id: 31n,
                campaignId: 15n,
                type: 'FUNDRAISING',
                title: 'Quỹ học bổng',
                description: 'Gây quỹ hỗ trợ',
                startAt: new Date('2025-01-05T00:00:00.000Z'),
                endAt: new Date('2026-12-31T00:00:00.000Z'),
                status: 'ACTIVE',
                settingsJson: {
                    target_amount: 5000000,
                    receiver_name: 'CLB Tình nguyện CNTT',
                    bank_name: 'VCB',
                    bank_account_no: '123456789',
                },
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                moneyDonations: [],
                itemTargets: [],
                eventRegistrations: [],
            },
        ],
        reviews: [...campaignState.reviews],
        activities: [...campaignState.activities],
    })

    beforeEach(() => {
        jest.clearAllMocks()
        campaignState.status = 'DRAFT'
        campaignState.approvedAt = null
        campaignState.publishedAt = null
        campaignState.approvedBy = null
        campaignState.reviews = []
        campaignState.activities = []
        ;(approvalsRepository as any).APPROVAL_STATUSES = approvalStatuses

        ;(campaignRepository.findCampaignById as jest.Mock).mockImplementation(
            async () => buildCampaignRecord()
        )
        ;(campaignRepository.transitionCampaign as jest.Mock).mockImplementation(
            async (_id, data) => {
                campaignState.status = data.status
                campaignState.approvedAt = data.approvedAt ?? campaignState.approvedAt
                campaignState.publishedAt = data.publishedAt ?? campaignState.publishedAt
                campaignState.approvedBy = data.approvedBy ?? campaignState.approvedBy
                return buildCampaignRecord()
            }
        )
        ;(campaignRepository.createReview as jest.Mock).mockImplementation(
            async ({ body, authorId }) => {
                const review = {
                    id: BigInt(campaignState.reviews.length + 1),
                    campaignId: 15n,
                    moduleId: null,
                    authorType: 'OPERATOR',
                    authorId,
                    body,
                    visibility: 'INTERNAL',
                    attachmentUrl: null,
                    createdAt: new Date('2025-01-02T00:00:00.000Z'),
                    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
                }
                campaignState.reviews.unshift(review)
                return review
            }
        )
        ;(campaignRepository.createActivity as jest.Mock).mockImplementation(
            async ({ activityType, message }) => {
                const activity = {
                    id: BigInt(campaignState.activities.length + 1),
                    activityType,
                    message: message ?? null,
                    createdAt: new Date('2025-01-02T00:00:00.000Z'),
                }
                campaignState.activities.unshift(activity)
                return activity
            }
        )
        ;(campaignRepository.createAuditLog as jest.Mock).mockResolvedValue({})
        ;(
            approvalsRepository.findApprovalQueue as jest.Mock
        ).mockImplementation(async ({ where }) => {
            const statusFilter = where.status
            const allowedStatuses = Array.isArray(statusFilter?.in)
                ? statusFilter.in
                : typeof statusFilter === 'string'
                  ? [statusFilter]
                  : approvalStatuses

            const items = allowedStatuses.includes(campaignState.status)
                ? [buildCampaignRecord()]
                : []

            return [items, items.length]
        })
        ;(
            publicRepository.findPublicCampaignBySlug as jest.Mock
        ).mockImplementation(async (slug: string) => {
            if (
                slug !== 'chien-dich-mua-he-xanh' ||
                !['PUBLISHED', 'ONGOING'].includes(campaignState.status)
            ) {
                return null
            }

            return buildCampaignRecord()
        })
        ;(publicRepository.findPublicCampaigns as jest.Mock).mockImplementation(
            async () => {
                const items = ['PUBLISHED', 'ONGOING'].includes(campaignState.status)
                    ? [buildCampaignRecord()]
                    : []
                return [items, items.length]
            }
        )
    })

    it('runs submit -> queue -> pre-approve -> approve -> publish -> public visibility', async () => {
        const submitted = await campaignService.submitCampaignForReview(
            '15',
            ownerPrincipal
        )
        expect(submitted.status).toBe('SUBMITTED')

        const queueAfterSubmit = await approvalsService.getApprovalQueue(
            {},
            reviewerPrincipal
        )
        expect(queueAfterSubmit.items).toHaveLength(1)
        expect(queueAfterSubmit.items[0]?.status).toBe('SUBMITTED')

        const preApproved = await campaignService.preApproveCampaign(
            '15',
            'ready',
            reviewerPrincipal
        )
        expect(preApproved.status).toBe('PRE_APPROVED')

        const queueAfterPreApprove = await approvalsService.getApprovalQueue(
            {},
            reviewerPrincipal
        )
        expect(queueAfterPreApprove.items).toHaveLength(1)
        expect(queueAfterPreApprove.items[0]?.status).toBe('PRE_APPROVED')

        const approved = await campaignService.approveCampaign(
            '15',
            'ok',
            reviewerPrincipal
        )
        expect(approved.status).toBe('APPROVED')

        const queueAfterApprove = await approvalsService.getApprovalQueue(
            {},
            reviewerPrincipal
        )
        expect(queueAfterApprove.items).toHaveLength(0)

        const published = await campaignService.publishCampaign(
            '15',
            ownerPrincipal
        )
        expect(published.status).toBe('PUBLISHED')

        const publicDetail = await publicService.getCampaignBySlug(
            'chien-dich-mua-he-xanh'
        )
        expect(publicDetail.status).toBe('PUBLISHED')
        expect(publicDetail.modules).toHaveLength(1)

        const publicList = await publicService.listCampaigns({})
        expect(publicList.items).toHaveLength(1)
        expect(publicList.items[0]?.slug).toBe('chien-dich-mua-he-xanh')
    })
})
