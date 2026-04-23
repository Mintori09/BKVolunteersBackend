import * as statisticsRepository from '../statistics.repository'
import * as statisticsService from '../statistics.service'

jest.mock('../statistics.repository')

describe('Statistics Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getSystemStatistics', () => {
        it('should return aggregated system statistics', async () => {
            ;(statisticsRepository.getSystemStatistics as jest.Mock).mockResolvedValue(
                {
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
                }
            )

            const result = await statisticsService.getSystemStatistics()

            expect(result.totalStudents).toBe(100)
            expect(statisticsRepository.getSystemStatistics).toHaveBeenCalled()
        })
    })
})
