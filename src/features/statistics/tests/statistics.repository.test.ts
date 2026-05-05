jest.mock('src/config/prisma', () => ({
    __esModule: true,
    default: {
        student: {
            count: jest.fn(),
        },
        user: {
            count: jest.fn(),
        },
        club: {
            count: jest.fn(),
        },
        campaign: {
            count: jest.fn(),
        },
        donation: {
            aggregate: jest.fn(),
        },
    },
}))

import prismaClient from 'src/config/prisma'
import * as statisticsRepository from '../statistics.repository'

describe('Statistics Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getSystemStatistics', () => {
        it('should exclude soft-deleted campaigns from totals and status counts', async () => {
            ;(prismaClient.student.count as jest.Mock).mockResolvedValue(100)
            ;(prismaClient.user.count as jest.Mock).mockResolvedValue(20)
            ;(prismaClient.club.count as jest.Mock).mockResolvedValue(5)
            ;(prismaClient.campaign.count as jest.Mock)
                .mockResolvedValueOnce(12)
                .mockResolvedValueOnce(1)
                .mockResolvedValueOnce(2)
                .mockResolvedValueOnce(3)
                .mockResolvedValueOnce(1)
                .mockResolvedValueOnce(4)
                .mockResolvedValueOnce(1)
            ;(prismaClient.donation.aggregate as jest.Mock).mockResolvedValue({
                _sum: { verifiedAmount: 500000 },
            })

            const result = await statisticsRepository.getSystemStatistics()

            expect(prismaClient.campaign.count).toHaveBeenNthCalledWith(1, {
                where: { deletedAt: null },
            })
            expect(prismaClient.campaign.count).toHaveBeenNthCalledWith(2, {
                where: { deletedAt: null, status: 'DRAFT' },
            })
            expect(prismaClient.campaign.count).toHaveBeenNthCalledWith(3, {
                where: { deletedAt: null, status: 'PENDING' },
            })
            expect(prismaClient.campaign.count).toHaveBeenNthCalledWith(4, {
                where: { deletedAt: null, status: 'ACTIVE' },
            })
            expect(prismaClient.campaign.count).toHaveBeenNthCalledWith(5, {
                where: { deletedAt: null, status: 'REJECTED' },
            })
            expect(prismaClient.campaign.count).toHaveBeenNthCalledWith(6, {
                where: { deletedAt: null, status: 'COMPLETED' },
            })
            expect(prismaClient.campaign.count).toHaveBeenNthCalledWith(7, {
                where: { deletedAt: null, status: 'CANCELLED' },
            })
            expect(result).toEqual({
                totalStudents: 100,
                totalUsers: 20,
                totalClubs: 5,
                totalCampaigns: 12,
                campaignsByStatus: {
                    DRAFT: 1,
                    PENDING: 2,
                    ACTIVE: 3,
                    REJECTED: 1,
                    COMPLETED: 4,
                    CANCELLED: 1,
                },
                totalVerifiedDonationAmount: 500000,
            })
        })
    })
})
