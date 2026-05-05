import * as moneyDonationRepo from '../money-donation.repository'
import { DonationStatus } from '@prisma/client'

jest.mock('src/config/prisma', () => ({
    __esModule: true,
    default: {
        moneyDonationCampaign: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        donation: {
            count: jest.fn(),
            findMany: jest.fn(),
        },
    },
}))

describe('MoneyDonation Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('findMoneyPhaseById', () => {
        it('should return money phase with campaign', async () => {
            const mockPhase = {
                id: 1,
                campaignId: 'camp-1',
                targetAmount: BigInt(1000000),
                campaign: { id: 'camp-1', title: 'Campaign', status: 'ACTIVE', creatorId: 'user-1' },
            }
            const prismaClient = require('src/config/prisma').default
            ;(prismaClient.moneyDonationCampaign.findUnique as jest.Mock).mockResolvedValue(mockPhase)

            const result = await moneyDonationRepo.findMoneyPhaseById(1)

            expect(result).toEqual(mockPhase)
            expect(prismaClient.moneyDonationCampaign.findUnique).toHaveBeenCalledWith({
                where: { id: 1, deletedAt: null },
                include: {
                    campaign: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                            creatorId: true,
                        },
                    },
                },
            })
        })

        it('should return null if not found', async () => {
            const prismaClient = require('src/config/prisma').default
            ;(prismaClient.moneyDonationCampaign.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await moneyDonationRepo.findMoneyPhaseById(999)

            expect(result).toBeNull()
        })
    })

    describe('findMoneyPhaseByCampaignId', () => {
        it('should return money phase for campaign', async () => {
            const mockPhase = { id: 1, campaignId: 'camp-1' }
            const prismaClient = require('src/config/prisma').default
            ;(prismaClient.moneyDonationCampaign.findFirst as jest.Mock).mockResolvedValue(mockPhase)

            const result = await moneyDonationRepo.findMoneyPhaseByCampaignId('camp-1')

            expect(result).toEqual(mockPhase)
            expect(prismaClient.moneyDonationCampaign.findFirst).toHaveBeenCalledWith({
                where: { campaignId: 'camp-1', deletedAt: null },
            })
        })

        it('should return null if no phase for campaign', async () => {
            const prismaClient = require('src/config/prisma').default
            ;(prismaClient.moneyDonationCampaign.findFirst as jest.Mock).mockResolvedValue(null)

            const result = await moneyDonationRepo.findMoneyPhaseByCampaignId('camp-1')

            expect(result).toBeNull()
        })
    })

    describe('createMoneyPhase', () => {
        it('should create money phase with qrImageUrl', async () => {
            const mockPhase = {
                id: 1,
                campaignId: 'camp-1',
                targetAmount: BigInt(1000000),
                qrImageUrl: 'https://qr.url',
            }
            const prismaClient = require('src/config/prisma').default
            ;(prismaClient.moneyDonationCampaign.create as jest.Mock).mockResolvedValue(mockPhase)

            const result = await moneyDonationRepo.createMoneyPhase('camp-1', {
                targetAmount: 1000000,
                qrImageUrl: 'https://qr.url',
                bankAccountNo: '123456',
                bankAccountName: 'Test',
                bankCode: 'VCB',
                startDate: new Date('2025-01-01'),
                endDate: new Date('2025-12-31'),
            })

            expect(result).toEqual(mockPhase)
            expect(prismaClient.moneyDonationCampaign.create).toHaveBeenCalledWith({
                data: {
                    campaignId: 'camp-1',
                    targetAmount: 1000000,
                    qrImageUrl: 'https://qr.url',
                    bankAccountNo: '123456',
                    bankAccountName: 'Test',
                    bankCode: 'VCB',
                    startDate: expect.any(Date),
                    endDate: expect.any(Date),
                },
            })
        })
    })

    describe('updateMoneyPhase', () => {
        it('should update money phase', async () => {
            const mockPhase = { id: 1, targetAmount: BigInt(2000000) }
            const prismaClient = require('src/config/prisma').default
            ;(prismaClient.moneyDonationCampaign.update as jest.Mock).mockResolvedValue(mockPhase)

            const result = await moneyDonationRepo.updateMoneyPhase(1, {
                targetAmount: 2000000,
            })

            expect(result).toEqual(mockPhase)
            expect(prismaClient.moneyDonationCampaign.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    targetAmount: 2000000,
                    bankAccountNo: undefined,
                    bankAccountName: undefined,
                    bankCode: undefined,
                    qrImageUrl: undefined,
                    startDate: undefined,
                    endDate: undefined,
                },
            })
        })
    })

    describe('softDeleteMoneyPhase', () => {
        it('should soft delete money phase', async () => {
            const mockPhase = { id: 1, deletedAt: new Date() }
            const prismaClient = require('src/config/prisma').default
            ;(prismaClient.moneyDonationCampaign.update as jest.Mock).mockResolvedValue(mockPhase)

            const result = await moneyDonationRepo.softDeleteMoneyPhase(1)

            expect(result).toEqual(mockPhase)
            expect(prismaClient.moneyDonationCampaign.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { deletedAt: expect.any(Date) },
            })
        })
    })

    describe('countDonationsByPhase', () => {
        it('should return count of donations', async () => {
            const prismaClient = require('src/config/prisma').default
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(5)

            const result = await moneyDonationRepo.countDonationsByPhase(1)

            expect(result).toBe(5)
            expect(prismaClient.donation.count).toHaveBeenCalledWith({
                where: { moneyPhaseId: 1 },
            })
        })
    })

    describe('getPhaseProgress', () => {
        it('should return null if phase not found', async () => {
            const prismaClient = require('src/config/prisma').default
            ;(prismaClient.moneyDonationCampaign.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await moneyDonationRepo.getPhaseProgress(999)

            expect(result).toBeNull()
        })

        it('should return phase progress', async () => {
            const mockPhase = {
                id: 1,
                targetAmount: BigInt(1000000),
                currentAmount: BigInt(500000),
            }
            const prismaClient = require('src/config/prisma').default
            ;(prismaClient.moneyDonationCampaign.findUnique as jest.Mock).mockResolvedValue(mockPhase)
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(10)
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])

            const result = await moneyDonationRepo.getPhaseProgress(1)

            expect(result).toEqual({
                phaseId: 1,
                targetAmount: '1000000',
                currentAmount: '500000',
                percentage: 50,
                totalDonations: 10,
                verifiedDonations: 10,
                pendingDonations: 10,
                rejectedDonations: 10,
                recentDonations: [],
            })
        })

        it('should calculate percentage correctly', async () => {
            const mockPhase = {
                id: 1,
                targetAmount: BigInt(1000000),
                currentAmount: BigInt(333333),
            }
            const prismaClient = require('src/config/prisma').default
            ;(prismaClient.moneyDonationCampaign.findUnique as jest.Mock).mockResolvedValue(mockPhase)
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])

            const result = await moneyDonationRepo.getPhaseProgress(1)

            expect(result?.percentage).toBe(33.33)
        })

        it('should return 0 percentage when targetAmount is 0', async () => {
            const mockPhase = {
                id: 1,
                targetAmount: BigInt(0),
                currentAmount: BigInt(500000),
            }
            const prismaClient = require('src/config/prisma').default
            ;(prismaClient.moneyDonationCampaign.findUnique as jest.Mock).mockResolvedValue(mockPhase)
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])

            const result = await moneyDonationRepo.getPhaseProgress(1)

            expect(result?.percentage).toBe(0)
        })
    })

    describe('findDonationsByPhase', () => {
        it('should return paginated donations without status filter', async () => {
            const mockDonations = [
                {
                    id: 'don-1',
                    amount: BigInt(100000),
                    verifiedAmount: BigInt(100000),
                    status: DonationStatus.VERIFIED,
                    student: { id: 'student-1', mssv: '123', fullName: 'Test' },
                },
            ]
            const prismaClient = require('src/config/prisma').default
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue(mockDonations)
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(1)

            const result = await moneyDonationRepo.findDonationsByPhase(1, {})

            expect(result.donations).toHaveLength(1)
            expect(result.donations[0].amount).toBe('100000')
            expect(result.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 })
        })

        it('should filter donations by status', async () => {
            const mockDonations: any[] = []
            const prismaClient = require('src/config/prisma').default
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue(mockDonations)
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)

            await moneyDonationRepo.findDonationsByPhase(1, { status: 'PENDING' })

            expect(prismaClient.donation.findMany).toHaveBeenCalledWith({
                where: { moneyPhaseId: 1, status: 'PENDING' },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: expect.any(Object),
            })
        })

        it('should apply pagination correctly', async () => {
            const prismaClient = require('src/config/prisma').default
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(25)

            const result = await moneyDonationRepo.findDonationsByPhase(1, { page: 2, limit: 10 })

            expect(prismaClient.donation.findMany).toHaveBeenCalledWith({
                where: { moneyPhaseId: 1 },
                skip: 10,
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: expect.any(Object),
            })
            expect(result.meta.totalPages).toBe(3)
        })

        it('should use default pagination values', async () => {
            const prismaClient = require('src/config/prisma').default
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)

            await moneyDonationRepo.findDonationsByPhase(1, {})

            expect(prismaClient.donation.findMany).toHaveBeenCalledWith({
                where: { moneyPhaseId: 1 },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: expect.any(Object),
            })
        })

        it('should handle null verifiedAmount', async () => {
            const mockDonations = [
                {
                    id: 'don-1',
                    amount: BigInt(100000),
                    verifiedAmount: null,
                    status: DonationStatus.PENDING,
                    student: { id: 'student-1', mssv: '123', fullName: 'Test' },
                },
            ]
            const prismaClient = require('src/config/prisma').default
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue(mockDonations)
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(1)

            const result = await moneyDonationRepo.findDonationsByPhase(1, {})

            expect(result.donations[0].verifiedAmount).toBeNull()
        })
    })
})