import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import * as donationRepository from '../donation.repository'
import * as gamificationService from '../../gamification/gamification.service'
import { canSubmitDonation, canRejectDonation, canVerifyDonation } from '../donation.permission'
import * as donationService from '../donation.service'

jest.mock('../donation.repository')
jest.mock('../../gamification/gamification.service')
jest.mock('../donation.permission')

describe('Donation Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('submitDonation', () => {
        it('should throw NOT_FOUND if money phase not found', async () => {
            ;(donationRepository.findMoneyPhaseWithCampaign as jest.Mock).mockResolvedValue(null)

            await expect(
                donationService.submitDonation('student-1', { moneyPhaseId: 1, amount: 100000, proofImageUrl: 'url' })
            ).rejects.toThrow(ApiError)
            await expect(
                donationService.submitDonation('student-1', { moneyPhaseId: 1, amount: 100000, proofImageUrl: 'url' })
            ).rejects.toHaveProperty('statusCode', HttpStatus.NOT_FOUND)
        })

        it('should throw FORBIDDEN if permission denied', async () => {
            ;(donationRepository.findMoneyPhaseWithCampaign as jest.Mock).mockResolvedValue({
                id: 1,
                campaign: { id: 'campaign-1', status: 'DRAFT' },
            })
            ;(canSubmitDonation as jest.Mock).mockReturnValue({ allowed: false, message: 'Permission denied' })

            await expect(
                donationService.submitDonation('student-1', { moneyPhaseId: 1, amount: 100000, proofImageUrl: 'url' })
            ).rejects.toThrow(ApiError)
            await expect(
                donationService.submitDonation('student-1', { moneyPhaseId: 1, amount: 100000, proofImageUrl: 'url' })
            ).rejects.toHaveProperty('statusCode', HttpStatus.FORBIDDEN)
        })

        it('should create donation successfully', async () => {
            const mockDonation = { id: 'don-1', status: 'PENDING' }
            ;(donationRepository.findMoneyPhaseWithCampaign as jest.Mock).mockResolvedValue({
                id: 1,
                campaign: { id: 'campaign-1', status: 'ACTIVE' },
            })
            ;(canSubmitDonation as jest.Mock).mockReturnValue({ allowed: true })
            ;(donationRepository.createDonation as jest.Mock).mockResolvedValue(mockDonation)

            const result = await donationService.submitDonation('student-1', {
                moneyPhaseId: 1,
                amount: 100000,
                proofImageUrl: 'url',
            })

            expect(result).toEqual(mockDonation)
            expect(donationRepository.createDonation).toHaveBeenCalledWith('student-1', expect.any(Object))
        })
    })

    describe('rejectDonation', () => {
        it('should throw NOT_FOUND if donation not found', async () => {
            ;(donationRepository.findDonationById as jest.Mock).mockResolvedValue(null)

            await expect(donationService.rejectDonation('don-1', { reason: 'test' }, 'user-1', 'CLB')).rejects.toThrow(
                ApiError
            )
            await expect(donationService.rejectDonation('don-1', { reason: 'test' }, 'user-1', 'CLB')).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.NOT_FOUND
            )
        })

        it('should throw BAD_REQUEST if donation is not PENDING', async () => {
            ;(donationRepository.findDonationById as jest.Mock).mockResolvedValue({
                id: 'don-1',
                status: 'VERIFIED',
                moneyPhase: { campaign: {} },
            })

            await expect(donationService.rejectDonation('don-1', { reason: 'test' }, 'user-1', 'CLB')).rejects.toThrow(
                ApiError
            )
            await expect(donationService.rejectDonation('don-1', { reason: 'test' }, 'user-1', 'CLB')).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.BAD_REQUEST
            )
        })

        it('should throw NOT_FOUND if campaign not found', async () => {
            ;(donationRepository.findDonationById as jest.Mock).mockResolvedValue({
                id: 'don-1',
                status: 'PENDING',
                moneyPhase: null,
                itemPhase: null,
            })

            await expect(donationService.rejectDonation('don-1', { reason: 'test' }, 'user-1', 'CLB')).rejects.toThrow(
                ApiError
            )
            await expect(donationService.rejectDonation('don-1', { reason: 'test' }, 'user-1', 'CLB')).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.NOT_FOUND
            )
        })

        it('should throw FORBIDDEN if permission denied', async () => {
            ;(donationRepository.findDonationById as jest.Mock).mockResolvedValue({
                id: 'don-1',
                status: 'PENDING',
                moneyPhase: { campaign: { creatorId: 'other-user' } },
                itemPhase: null,
            })
            ;(canRejectDonation as jest.Mock).mockReturnValue({ allowed: false, message: 'No permission' })

            await expect(donationService.rejectDonation('don-1', { reason: 'test' }, 'user-1', 'CLB')).rejects.toThrow(
                ApiError
            )
            await expect(donationService.rejectDonation('don-1', { reason: 'test' }, 'user-1', 'CLB')).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.FORBIDDEN
            )
        })

        it('should reject donation successfully', async () => {
            const mockDonation = { id: 'don-1', status: 'REJECTED', rejectionReason: 'Invalid' }
            ;(donationRepository.findDonationById as jest.Mock).mockResolvedValue({
                id: 'don-1',
                status: 'PENDING',
                moneyPhase: { campaign: { creatorId: 'user-1' } },
                itemPhase: null,
            })
            ;(canRejectDonation as jest.Mock).mockReturnValue({ allowed: true })
            ;(donationRepository.rejectDonation as jest.Mock).mockResolvedValue(mockDonation)

            const result = await donationService.rejectDonation('don-1', { reason: 'Invalid' }, 'user-1', 'CLB')

            expect(result).toEqual(mockDonation)
            expect(donationRepository.rejectDonation).toHaveBeenCalledWith('don-1', 'Invalid')
        })
    })

    describe('verifyDonation', () => {
        it('should throw NOT_FOUND if donation not found', async () => {
            ;(donationRepository.findDonationById as jest.Mock).mockResolvedValue(null)

            await expect(donationService.verifyDonation('don-1', {}, 'user-1', 'CLB')).rejects.toThrow(ApiError)
            await expect(donationService.verifyDonation('don-1', {}, 'user-1', 'CLB')).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.NOT_FOUND
            )
        })

        it('should throw BAD_REQUEST if donation is not PENDING', async () => {
            ;(donationRepository.findDonationById as jest.Mock).mockResolvedValue({
                id: 'don-1',
                status: 'REJECTED',
                moneyPhase: { campaign: {} },
            })

            await expect(donationService.verifyDonation('don-1', {}, 'user-1', 'CLB')).rejects.toThrow(ApiError)
            await expect(donationService.verifyDonation('don-1', {}, 'user-1', 'CLB')).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.BAD_REQUEST
            )
        })

        it('should throw NOT_FOUND if campaign not found', async () => {
            ;(donationRepository.findDonationById as jest.Mock).mockResolvedValue({
                id: 'don-1',
                status: 'PENDING',
                moneyPhase: null,
                itemPhase: null,
            })

            await expect(donationService.verifyDonation('don-1', {}, 'user-1', 'CLB')).rejects.toThrow(ApiError)
            await expect(donationService.verifyDonation('don-1', {}, 'user-1', 'CLB')).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.NOT_FOUND
            )
        })

        it('should throw FORBIDDEN if permission denied', async () => {
            ;(donationRepository.findDonationById as jest.Mock).mockResolvedValue({
                id: 'don-1',
                status: 'PENDING',
                moneyPhase: { campaign: { creatorId: 'other-user' } },
                itemPhase: null,
            })
            ;(canVerifyDonation as jest.Mock).mockReturnValue({ allowed: false, message: 'No permission' })

            await expect(donationService.verifyDonation('don-1', {}, 'user-1', 'CLB')).rejects.toThrow(ApiError)
            await expect(donationService.verifyDonation('don-1', {}, 'user-1', 'CLB')).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.FORBIDDEN
            )
        })

        it('should verify money donation and award points', async () => {
            const mockDonation = { id: 'don-1', status: 'VERIFIED', verifiedAmount: 50000, moneyPhaseId: 1 }
            ;(donationRepository.findDonationById as jest.Mock).mockResolvedValue({
                id: 'don-1',
                status: 'PENDING',
                studentId: 'student-1',
                moneyPhaseId: 1,
                moneyPhase: { campaign: { creatorId: 'user-1', title: 'Campaign 1' } },
                itemPhase: null,
            })
            ;(canVerifyDonation as jest.Mock).mockReturnValue({ allowed: true })
            ;(donationRepository.verifyDonation as jest.Mock).mockResolvedValue(mockDonation)
            ;(gamificationService.awardPoints as jest.Mock).mockResolvedValue([])

            const result = await donationService.verifyDonation('don-1', { verifiedAmount: 50000 }, 'user-1', 'CLB')

            expect(result).toEqual(mockDonation)
            expect(gamificationService.awardPoints).toHaveBeenCalledWith(
                expect.objectContaining({
                    studentId: 'student-1',
                    points: 5,
                    sourceType: 'MONEY_DONATION',
                })
            )
        })

        it('should verify item donation and award default points', async () => {
            const mockDonation = { id: 'don-1', status: 'VERIFIED', itemPhaseId: 1 }
            ;(donationRepository.findDonationById as jest.Mock).mockResolvedValue({
                id: 'don-1',
                status: 'PENDING',
                studentId: 'student-1',
                moneyPhaseId: null,
                itemPhaseId: 1,
                moneyPhase: null,
                itemPhase: { campaign: { creatorId: 'user-1', title: 'Campaign 1' } },
            })
            ;(canVerifyDonation as jest.Mock).mockReturnValue({ allowed: true })
            ;(donationRepository.verifyDonation as jest.Mock).mockResolvedValue(mockDonation)
            ;(gamificationService.awardPoints as jest.Mock).mockResolvedValue([])

            const result = await donationService.verifyDonation('don-1', { points: 10 }, 'user-1', 'CLB')

            expect(result).toEqual(mockDonation)
            expect(gamificationService.awardPoints).toHaveBeenCalledWith(
                expect.objectContaining({
                    studentId: 'student-1',
                    points: 10,
                    sourceType: 'ITEM_DONATION',
                })
            )
        })

        it('should not award points when points is 0', async () => {
            const mockDonation = { id: 'don-1', status: 'VERIFIED', verifiedAmount: 0 }
            ;(donationRepository.findDonationById as jest.Mock).mockResolvedValue({
                id: 'don-1',
                status: 'PENDING',
                studentId: 'student-1',
                moneyPhaseId: 1,
                moneyPhase: { campaign: { creatorId: 'user-1', title: 'Campaign 1' } },
                itemPhase: null,
            })
            ;(canVerifyDonation as jest.Mock).mockReturnValue({ allowed: true })
            ;(donationRepository.verifyDonation as jest.Mock).mockResolvedValue(mockDonation)

            await donationService.verifyDonation('don-1', { verifiedAmount: 0 }, 'user-1', 'CLB')

            expect(gamificationService.awardPoints).not.toHaveBeenCalled()
        })
    })

    describe('getMyDonations', () => {
        it('should return paginated donations for student', async () => {
            const mockResult = { donations: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }
            ;(donationRepository.findDonationsByStudent as jest.Mock).mockResolvedValue(mockResult)

            const result = await donationService.getMyDonations('student-1', {})

            expect(donationRepository.findDonationsByStudent).toHaveBeenCalledWith('student-1', {})
            expect(result).toEqual(mockResult)
        })

        it('should pass query parameters to repository', async () => {
            const mockResult = { donations: [], meta: { total: 0, page: 2, limit: 5, totalPages: 0 } }
            ;(donationRepository.findDonationsByStudent as jest.Mock).mockResolvedValue(mockResult)

            const result = await donationService.getMyDonations('student-1', { page: 2, limit: 5, status: 'PENDING' })

            expect(donationRepository.findDonationsByStudent).toHaveBeenCalledWith('student-1', {
                page: 2,
                limit: 5,
                status: 'PENDING',
            })
            expect(result).toEqual(mockResult)
        })
    })

    describe('getDonationsForAdmin', () => {
        it('should return paginated donations for admin', async () => {
            const mockResult = { donations: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }
            ;(donationRepository.findDonationsForAdmin as jest.Mock).mockResolvedValue(mockResult)

            const result = await donationService.getDonationsForAdmin({})

            expect(donationRepository.findDonationsForAdmin).toHaveBeenCalledWith({})
            expect(result).toEqual(mockResult)
        })

        it('should pass query parameters to repository', async () => {
            const mockResult = { donations: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }
            ;(donationRepository.findDonationsForAdmin as jest.Mock).mockResolvedValue(mockResult)

            const result = await donationService.getDonationsForAdmin({
                status: 'VERIFIED',
                studentId: 'student-1',
                page: 1,
                limit: 10,
            })

            expect(donationRepository.findDonationsForAdmin).toHaveBeenCalledWith({
                status: 'VERIFIED',
                studentId: 'student-1',
                page: 1,
                limit: 10,
            })
            expect(result).toEqual(mockResult)
        })
    })
})