import { canSubmitDonation, canProcessDonation, canViewMyDonations } from '../donation.permission'
import { Campaign } from '@prisma/client'

describe('Donation Permission', () => {
    const mockCampaign = (status: string, creatorId?: string): any => ({
        id: 'campaign-1',
        title: 'Test Campaign',
        description: 'Test Description',
        status: status,
        scope: 'CONG',
        creatorId: creatorId || 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    })

    describe('canSubmitDonation', () => {
        it('should return allowed: true when campaign status is ACTIVE', () => {
            const campaign = mockCampaign('ACTIVE')
            const result = canSubmitDonation(campaign)
            expect(result.allowed).toBe(true)
        })

        it('should return allowed: false when campaign status is not ACTIVE', () => {
            const statuses = ['DRAFT', 'PENDING', 'COMPLETED', 'CANCELLED']
            statuses.forEach((status) => {
                const campaign = mockCampaign(status)
                const result = canSubmitDonation(campaign)
                expect(result.allowed).toBe(false)
                expect(result.message).toBe('Không thể đóng góp vào chiến dịch không hoạt động')
            })
        })
    })

    describe('canProcessDonation', () => {
        it('should return allowed: false for SINHVIEN role', () => {
            const campaign = mockCampaign('ACTIVE')
            const result = canProcessDonation(campaign, 'user-1', 'SINHVIEN')
            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Sinh viên không có quyền xử lý đóng góp')
        })

        it('should return allowed: true for DOANTRUONG role', () => {
            const campaign = mockCampaign('ACTIVE')
            const result = canProcessDonation(campaign, 'user-1', 'DOANTRUONG')
            expect(result.allowed).toBe(true)
        })

        it('should return allowed: true for CLB role when user is campaign creator', () => {
            const campaign = mockCampaign('ACTIVE', 'user-1')
            const result = canProcessDonation(campaign, 'user-1', 'CLB')
            expect(result.allowed).toBe(true)
        })

        it('should return allowed: false for CLB role when user is not campaign creator', () => {
            const campaign = mockCampaign('ACTIVE', 'user-2')
            const result = canProcessDonation(campaign, 'user-1', 'CLB')
            expect(result.allowed).toBe(false)
            expect(result.message).toBe('Bạn không phải là người tạo chiến dịch này')
        })

        it('should return allowed: true for LCD role when user is campaign creator', () => {
            const campaign = mockCampaign('ACTIVE', 'user-1')
            const result = canProcessDonation(campaign, 'user-1', 'LCD')
            expect(result.allowed).toBe(true)
        })

        it('should return allowed: false for LCD role when user is not campaign creator', () => {
            const campaign = mockCampaign('ACTIVE', 'user-2')
            const result = canProcessDonation(campaign, 'user-1', 'LCD')
            expect(result.allowed).toBe(false)
        })
    })

    describe('canRejectDonation', () => {
        it('should delegate to canProcessDonation', () => {
            const campaign = mockCampaign('ACTIVE', 'user-1')
            const result = canProcessDonation(campaign, 'user-1', 'DOANTRUONG')
            expect(result.allowed).toBe(true)
        })
    })

    describe('canVerifyDonation', () => {
        it('should delegate to canProcessDonation', () => {
            const campaign = mockCampaign('ACTIVE', 'user-1')
            const result = canProcessDonation(campaign, 'user-1', 'DOANTRUONG')
            expect(result.allowed).toBe(true)
        })
    })

    describe('canViewMyDonations', () => {
        it('should return true when studentId matches userId', () => {
            const result = canViewMyDonations('student-1', 'student-1')
            expect(result).toBe(true)
        })

        it('should return false when studentId does not match userId', () => {
            const result = canViewMyDonations('student-1', 'student-2')
            expect(result).toBe(false)
        })
    })
})