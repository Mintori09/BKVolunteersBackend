import * as campaignPermission from '../campaign.permission'
import { Campaign, CampaignScope, CampaignStatus } from '@prisma/client'

const createMockCampaign = (overrides: Partial<Campaign> = {}): Campaign => ({
    id: 'campaign-1',
    title: 'Test Campaign',
    description: 'Test Description',
    scope: 'TRUONG' as CampaignScope,
    status: 'DRAFT' as CampaignStatus,
    planFileUrl: null,
    budgetFileUrl: null,
    adminComment: null,
    approverId: null,
    creatorId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
})

describe('Campaign Permission', () => {
    describe('canCreateCampaign', () => {
        it('should allow CLB to create TRUONG scope campaign', () => {
            const result = campaignPermission.canCreateCampaign(
                'CLB',
                'TRUONG',
                null
            )
            expect(result.allowed).toBe(true)
        })

        it('should not allow SINHVIEN to create campaign', () => {
            const result = campaignPermission.canCreateCampaign(
                'SINHVIEN',
                'TRUONG',
                '102'
            )
            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Bạn không có quyền tạo chiến dịch')
        })

        it('should not allow CLB to create KHOA scope campaign', () => {
            const result = campaignPermission.canCreateCampaign(
                'CLB',
                'KHOA',
                '102'
            )
            expect(result.allowed).toBe(false)
            expect(result.message).toBe('CLB không thể tạo chiến dịch cấp khoa')
        })

        it('should allow LCD to create KHOA scope campaign', () => {
            const result = campaignPermission.canCreateCampaign(
                'LCD',
                'KHOA',
                '102'
            )
            expect(result.allowed).toBe(true)
        })

        it('should not allow LCD to create KHOA scope without facultyId', () => {
            const result = campaignPermission.canCreateCampaign(
                'LCD',
                'KHOA',
                null
            )
            expect(result.allowed).toBe(false)
        })

        it('should allow DOANTRUONG to create any scope campaign', () => {
            const truongResult = campaignPermission.canCreateCampaign(
                'DOANTRUONG',
                'TRUONG',
                null
            )
            const khoaResult = campaignPermission.canCreateCampaign(
                'DOANTRUONG',
                'KHOA',
                '102'
            )
            expect(truongResult.allowed).toBe(true)
            expect(khoaResult.allowed).toBe(true)
        })
    })

    describe('isCampaignCreator', () => {
        it('should return true when user is creator', () => {
            const campaign = createMockCampaign({ creatorId: 'user-1' })
            const result = campaignPermission.isCampaignCreator(
                campaign,
                'user-1'
            )
            expect(result).toBe(true)
        })

        it('should return false when user is not creator', () => {
            const campaign = createMockCampaign({ creatorId: 'user-1' })
            const result = campaignPermission.isCampaignCreator(
                campaign,
                'user-2'
            )
            expect(result).toBe(false)
        })
    })

    describe('canEditCampaign', () => {
        it('should allow creator to edit DRAFT campaign', () => {
            const campaign = createMockCampaign({
                status: 'DRAFT',
                creatorId: 'user-1',
            })
            const result = campaignPermission.canEditCampaign(
                campaign,
                'user-1',
                'CLB'
            )
            expect(result.allowed).toBe(true)
        })

        it('should not allow non-creator to edit campaign', () => {
            const campaign = createMockCampaign({
                status: 'DRAFT',
                creatorId: 'user-1',
            })
            const result = campaignPermission.canEditCampaign(
                campaign,
                'user-2',
                'CLB'
            )
            expect(result.allowed).toBe(false)
        })

        it('should not allow editing non-DRAFT campaign', () => {
            const campaign = createMockCampaign({
                status: 'PENDING',
                creatorId: 'user-1',
            })
            const result = campaignPermission.canEditCampaign(
                campaign,
                'user-1',
                'CLB'
            )
            expect(result.allowed).toBe(false)
        })

        it('should allow DOANTRUONG to edit any campaign', () => {
            const campaign = createMockCampaign({
                status: 'PENDING',
                creatorId: 'user-1',
            })
            const result = campaignPermission.canEditCampaign(
                campaign,
                'admin-1',
                'DOANTRUONG'
            )
            expect(result.allowed).toBe(true)
        })
    })

    describe('canDeleteCampaign', () => {
        it('should allow creator to delete DRAFT campaign', () => {
            const campaign = createMockCampaign({
                status: 'DRAFT',
                creatorId: 'user-1',
            })
            const result = campaignPermission.canDeleteCampaign(
                campaign,
                'user-1',
                'CLB'
            )
            expect(result.allowed).toBe(true)
        })

        it('should not allow deleting non-DRAFT campaign', () => {
            const campaign = createMockCampaign({
                status: 'ACTIVE',
                creatorId: 'user-1',
            })
            const result = campaignPermission.canDeleteCampaign(
                campaign,
                'user-1',
                'CLB'
            )
            expect(result.allowed).toBe(false)
        })
    })

    describe('canSubmitCampaign', () => {
        it('should allow creator to submit DRAFT campaign', () => {
            const campaign = createMockCampaign({
                status: 'DRAFT',
                creatorId: 'user-1',
            })
            const result = campaignPermission.canSubmitCampaign(
                campaign,
                'user-1',
                'CLB'
            )
            expect(result.allowed).toBe(true)
        })

        it('should not allow submitting non-DRAFT campaign', () => {
            const campaign = createMockCampaign({
                status: 'PENDING',
                creatorId: 'user-1',
            })
            const result = campaignPermission.canSubmitCampaign(
                campaign,
                'user-1',
                'CLB'
            )
            expect(result.allowed).toBe(false)
        })
    })

    describe('canApproveCampaign', () => {
        it('should allow DOANTRUONG to approve campaign', () => {
            const result = campaignPermission.canApproveCampaign('DOANTRUONG')
            expect(result.allowed).toBe(true)
        })

        it('should not allow CLB to approve campaign', () => {
            const result = campaignPermission.canApproveCampaign('CLB')
            expect(result.allowed).toBe(false)
            expect(result.message).toBe(
                'Chỉ Đoàn trường có quyền phê duyệt chiến dịch'
            )
        })

        it('should not allow LCD to approve campaign', () => {
            const result = campaignPermission.canApproveCampaign('LCD')
            expect(result.allowed).toBe(false)
        })
    })

    describe('canRejectCampaign', () => {
        it('should allow DOANTRUONG to reject campaign', () => {
            const result = campaignPermission.canRejectCampaign('DOANTRUONG')
            expect(result.allowed).toBe(true)
        })

        it('should not allow CLB to reject campaign', () => {
            const result = campaignPermission.canRejectCampaign('CLB')
            expect(result.allowed).toBe(false)
        })
    })

    describe('canCompleteCampaign', () => {
        it('should allow creator to complete ACTIVE campaign', () => {
            const campaign = createMockCampaign({
                status: 'ACTIVE',
                creatorId: 'user-1',
            })
            const result = campaignPermission.canCompleteCampaign(
                campaign,
                'user-1',
                'CLB'
            )
            expect(result.allowed).toBe(true)
        })

        it('should not allow completing non-ACTIVE campaign', () => {
            const campaign = createMockCampaign({
                status: 'PENDING',
                creatorId: 'user-1',
            })
            const result = campaignPermission.canCompleteCampaign(
                campaign,
                'user-1',
                'CLB'
            )
            expect(result.allowed).toBe(false)
        })

        it('should allow DOANTRUONG to complete any ACTIVE campaign', () => {
            const campaign = createMockCampaign({
                status: 'ACTIVE',
                creatorId: 'user-1',
            })
            const result = campaignPermission.canCompleteCampaign(
                campaign,
                'admin-1',
                'DOANTRUONG'
            )
            expect(result.allowed).toBe(true)
        })
    })

    describe('canCancelCampaign', () => {
        it('should allow creator to cancel ACTIVE campaign', () => {
            const campaign = createMockCampaign({
                status: 'ACTIVE',
                creatorId: 'user-1',
            })
            const result = campaignPermission.canCancelCampaign(
                campaign,
                'user-1',
                'CLB'
            )
            expect(result.allowed).toBe(true)
        })

        it('should not allow canceling non-ACTIVE campaign', () => {
            const campaign = createMockCampaign({
                status: 'COMPLETED',
                creatorId: 'user-1',
            })
            const result = campaignPermission.canCancelCampaign(
                campaign,
                'user-1',
                'CLB'
            )
            expect(result.allowed).toBe(false)
        })
    })

    describe('canUploadFile', () => {
        it('should allow creator to upload file for DRAFT campaign', () => {
            const campaign = createMockCampaign({
                status: 'DRAFT',
                creatorId: 'user-1',
            })
            const result = campaignPermission.canUploadFile(
                campaign,
                'user-1',
                'CLB'
            )
            expect(result.allowed).toBe(true)
        })

        it('should allow creator to upload file for PENDING campaign', () => {
            const campaign = createMockCampaign({
                status: 'PENDING',
                creatorId: 'user-1',
            })
            const result = campaignPermission.canUploadFile(
                campaign,
                'user-1',
                'CLB'
            )
            expect(result.allowed).toBe(true)
        })

        it('should not allow uploading file for ACTIVE campaign', () => {
            const campaign = createMockCampaign({
                status: 'ACTIVE',
                creatorId: 'user-1',
            })
            const result = campaignPermission.canUploadFile(
                campaign,
                'user-1',
                'CLB'
            )
            expect(result.allowed).toBe(false)
        })
    })
})
