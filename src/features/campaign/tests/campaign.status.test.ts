import * as campaignStatus from '../campaign.status'
import { CampaignStatus } from '@prisma/client'

describe('Campaign Status', () => {
    describe('canTransitionTo', () => {
        it('should return true for valid DRAFT -> PENDING transition by CLB', () => {
            const result = campaignStatus.canTransitionTo(
                'DRAFT',
                'PENDING',
                'CLB'
            )
            expect(result).toBe(true)
        })

        it('should return true for valid PENDING -> ACTIVE transition by DOANTRUONG', () => {
            const result = campaignStatus.canTransitionTo(
                'PENDING',
                'ACTIVE',
                'DOANTRUONG'
            )
            expect(result).toBe(true)
        })

        it('should return false for PENDING -> ACTIVE transition by CLB', () => {
            const result = campaignStatus.canTransitionTo(
                'PENDING',
                'ACTIVE',
                'CLB'
            )
            expect(result).toBe(false)
        })

        it('should return false for invalid transition', () => {
            const result = campaignStatus.canTransitionTo(
                'COMPLETED',
                'ACTIVE',
                'DOANTRUONG'
            )
            expect(result).toBe(false)
        })
    })

    describe('getValidTransitions', () => {
        it('should return PENDING for DRAFT status with CLB role', () => {
            const result = campaignStatus.getValidTransitions('DRAFT', 'CLB')
            expect(result).toContain('PENDING')
            expect(result).toHaveLength(1)
        })

        it('should return ACTIVE and REJECTED for PENDING status with DOANTRUONG role', () => {
            const result = campaignStatus.getValidTransitions(
                'PENDING',
                'DOANTRUONG'
            )
            expect(result).toContain('ACTIVE')
            expect(result).toContain('REJECTED')
            expect(result).toHaveLength(2)
        })

        it('should return COMPLETED and CANCELLED for ACTIVE status with CLB role', () => {
            const result = campaignStatus.getValidTransitions('ACTIVE', 'CLB')
            expect(result).toContain('COMPLETED')
            expect(result).toContain('CANCELLED')
        })

        it('should return empty array for COMPLETED status', () => {
            const result = campaignStatus.getValidTransitions(
                'COMPLETED',
                'DOANTRUONG'
            )
            expect(result).toHaveLength(0)
        })
    })

    describe('validateStatusTransition', () => {
        it('should return valid: true for valid transition', () => {
            const result = campaignStatus.validateStatusTransition(
                'DRAFT',
                'PENDING',
                'CLB'
            )
            expect(result.valid).toBe(true)
        })

        it('should return valid: false with message for invalid transition', () => {
            const result = campaignStatus.validateStatusTransition(
                'ACTIVE',
                'PENDING',
                'CLB'
            )
            expect(result.valid).toBe(false)
            expect(result.message).toBeDefined()
        })
    })

    describe('isCampaignEditable', () => {
        it('should return true for DRAFT status', () => {
            expect(campaignStatus.isCampaignEditable('DRAFT')).toBe(true)
        })

        it('should return false for non-DRAFT status', () => {
            expect(campaignStatus.isCampaignEditable('PENDING')).toBe(false)
            expect(campaignStatus.isCampaignEditable('ACTIVE')).toBe(false)
        })
    })

    describe('isCampaignDeletable', () => {
        it('should return true for DRAFT status', () => {
            expect(campaignStatus.isCampaignDeletable('DRAFT')).toBe(true)
        })

        it('should return false for non-DRAFT status', () => {
            expect(campaignStatus.isCampaignDeletable('ACTIVE')).toBe(false)
        })
    })

    describe('isCampaignSubmittable', () => {
        it('should return true for DRAFT status', () => {
            expect(campaignStatus.isCampaignSubmittable('DRAFT')).toBe(true)
        })

        it('should return false for non-DRAFT status', () => {
            expect(campaignStatus.isCampaignSubmittable('PENDING')).toBe(false)
        })
    })

    describe('isCampaignApprovable', () => {
        it('should return true for PENDING status', () => {
            expect(campaignStatus.isCampaignApprovable('PENDING')).toBe(true)
        })

        it('should return false for non-PENDING status', () => {
            expect(campaignStatus.isCampaignApprovable('DRAFT')).toBe(false)
        })
    })

    describe('isCampaignRejectable', () => {
        it('should return true for PENDING status', () => {
            expect(campaignStatus.isCampaignRejectable('PENDING')).toBe(true)
        })

        it('should return false for non-PENDING status', () => {
            expect(campaignStatus.isCampaignRejectable('ACTIVE')).toBe(false)
        })
    })

    describe('isCampaignCompletable', () => {
        it('should return true for ACTIVE status', () => {
            expect(campaignStatus.isCampaignCompletable('ACTIVE')).toBe(true)
        })

        it('should return false for non-ACTIVE status', () => {
            expect(campaignStatus.isCampaignCompletable('DRAFT')).toBe(false)
        })
    })

    describe('isCampaignCancellable', () => {
        it('should return true for ACTIVE status', () => {
            expect(campaignStatus.isCampaignCancellable('ACTIVE')).toBe(true)
        })

        it('should return false for non-ACTIVE status', () => {
            expect(campaignStatus.isCampaignCancellable('COMPLETED')).toBe(false)
        })
    })
})
