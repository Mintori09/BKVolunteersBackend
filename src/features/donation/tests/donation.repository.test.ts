import { DonationStatus } from '@prisma/client'

jest.mock('src/config/prisma', () => ({
    __esModule: true,
    default: {
        donation: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        moneyDonationCampaign: {
            findUnique: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}))

import prismaClient from 'src/config/prisma'
import * as donationRepository from '../donation.repository'

describe('Donation Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('findDonationById', () => {
        it('should find donation by id with includes', async () => {
            const mockDonation = { id: 'don-1', status: 'PENDING' }
            ;(prismaClient.donation.findUnique as jest.Mock).mockResolvedValue(mockDonation)

            const result = await donationRepository.findDonationById('don-1')

            expect(prismaClient.donation.findUnique).toHaveBeenCalledWith({
                where: { id: 'don-1' },
                include: expect.any(Object),
            })
            expect(result).toEqual(mockDonation)
        })

        it('should return null when donation not found', async () => {
            ;(prismaClient.donation.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await donationRepository.findDonationById('nonexistent')
            expect(result).toBeNull()
        })
    })

    describe('createDonation', () => {
        it('should create a donation with PENDING status', async () => {
            const mockDonation = { id: 'don-1', status: 'PENDING' }
            ;(prismaClient.donation.create as jest.Mock).mockResolvedValue(mockDonation)

            const data = {
                moneyPhaseId: 1,
                amount: 100000,
                proofImageUrl: 'https://example.com/proof.jpg',
            }

            const result = await donationRepository.createDonation('student-1', data)

            expect(prismaClient.donation.create).toHaveBeenCalledWith({
                data: {
                    studentId: 'student-1',
                    moneyPhaseId: 1,
                    amount: 100000,
                    proofImageUrl: 'https://example.com/proof.jpg',
                    status: 'PENDING',
                },
            })
            expect(result).toEqual(mockDonation)
        })
    })

    describe('rejectDonation', () => {
        it('should update donation status to REJECTED with reason', async () => {
            const mockDonation = { id: 'don-1', status: 'REJECTED', rejectionReason: 'Invalid' }
            ;(prismaClient.donation.update as jest.Mock).mockResolvedValue(mockDonation)

            const result = await donationRepository.rejectDonation('don-1', 'Invalid')

            expect(prismaClient.donation.update).toHaveBeenCalledWith({
                where: { id: 'don-1' },
                data: { status: 'REJECTED', rejectionReason: 'Invalid' },
            })
            expect(result).toEqual(mockDonation)
        })
    })

    describe('verifyDonation', () => {
        it('should verify donation and update money phase current amount', async () => {
            const mockDonation = { id: 'don-1', status: 'VERIFIED', verifiedAmount: 50000, moneyPhase: { id: 1 } }
            const tx = {
                donation: { update: jest.fn().mockResolvedValue(mockDonation) },
                moneyDonationCampaign: { update: jest.fn().mockResolvedValue({}) },
            }
            ;(prismaClient.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
                return cb(tx)
            })

            const result = await donationRepository.verifyDonation('don-1', 50000)

            expect(tx.donation.update).toHaveBeenCalledWith({
                where: { id: 'don-1' },
                data: { status: 'VERIFIED', verifiedAmount: 50000 },
                include: { moneyPhase: true },
            })
            expect(tx.moneyDonationCampaign.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { currentAmount: { increment: 50000 } },
            })
            expect(result).toEqual(mockDonation)
        })

        it('should verify donation without money phase', async () => {
            const mockDonation = { id: 'don-1', status: 'VERIFIED', verifiedAmount: 50000, moneyPhase: null }
            const tx = {
                donation: { update: jest.fn().mockResolvedValue(mockDonation) },
                moneyDonationCampaign: { update: jest.fn() },
            }
            ;(prismaClient.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
                return cb(tx)
            })

            const result = await donationRepository.verifyDonation('don-1', 50000)

            expect(tx.moneyDonationCampaign.update).not.toHaveBeenCalled()
            expect(result).toEqual(mockDonation)
        })
    })

    describe('findDonationsByStudent', () => {
        it('should return paginated donations for a student', async () => {
            const mockDonations = [
                { id: 'don-1', amount: BigInt(100000), verifiedAmount: null },
            ]
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue(mockDonations)
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(1)

            const result = await donationRepository.findDonationsByStudent('student-1', {})

            expect(result.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 })
        })

        it('should filter by status when provided', async () => {
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)

            await donationRepository.findDonationsByStudent('student-1', { status: 'PENDING' as DonationStatus })

            expect(prismaClient.donation.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ studentId: 'student-1', status: 'PENDING' }),
                })
            )
        })

        it('should use custom page and limit', async () => {
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)

            const result = await donationRepository.findDonationsByStudent('student-1', { page: 2, limit: 5 })

            expect(result.meta).toEqual({ total: 0, page: 2, limit: 5, totalPages: 0 })
        })
    })

    describe('findMoneyPhaseWithCampaign', () => {
        it('should find money phase with campaign by phase id', async () => {
            const mockPhase = { id: 1, campaign: { id: 'campaign-1' } }
            ;(prismaClient.moneyDonationCampaign.findUnique as jest.Mock).mockResolvedValue(mockPhase)

            const result = await donationRepository.findMoneyPhaseWithCampaign(1)

            expect(prismaClient.moneyDonationCampaign.findUnique).toHaveBeenCalledWith({
                where: { id: 1, deletedAt: null },
                include: expect.any(Object),
            })
            expect(result).toEqual(mockPhase)
        })

        it('should return null when money phase not found', async () => {
            ;(prismaClient.moneyDonationCampaign.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await donationRepository.findMoneyPhaseWithCampaign(999)
            expect(result).toBeNull()
        })
    })

    describe('findDonationsForAdmin', () => {
        it('should return paginated donations for admin with no filters', async () => {
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)

            const result = await donationRepository.findDonationsForAdmin({})

            expect(result.meta).toEqual({ total: 0, page: 1, limit: 20, totalPages: 0 })
        })

        it('should filter by status', async () => {
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)

            await donationRepository.findDonationsForAdmin({ status: 'PENDING' as DonationStatus })

            expect(prismaClient.donation.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ status: 'PENDING' }),
                })
            )
        })

        it('should filter by studentId', async () => {
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)

            await donationRepository.findDonationsForAdmin({ studentId: 'student-1' })

            expect(prismaClient.donation.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ studentId: 'student-1' }),
                })
            )
        })

        it('should filter by phaseType money', async () => {
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)

            await donationRepository.findDonationsForAdmin({ phaseType: 'money' })

            expect(prismaClient.donation.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ moneyPhaseId: { not: null } }),
                })
            )
        })

        it('should filter by phaseType item', async () => {
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)

            await donationRepository.findDonationsForAdmin({ phaseType: 'item' })

            expect(prismaClient.donation.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ itemPhaseId: { not: null } }),
                })
            )
        })

        it('should use custom page and limit', async () => {
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(25)

            const result = await donationRepository.findDonationsForAdmin({ page: 2, limit: 10 })

            expect(result.meta).toEqual({ total: 25, page: 2, limit: 10, totalPages: 3 })
        })
    })
})