import * as moneyDonationService from '../money-donation.service'
import * as moneyDonationRepo from '../money-donation.repository'
import * as campaignRepo from '../../campaign/campaign.repository'
import { canCreateMoneyPhase, canUpdateMoneyPhase, canDeleteMoneyPhase, canViewProgress, canViewPhaseDonations } from '../money-donation.permission'

jest.mock('../money-donation.repository')
jest.mock('../../campaign/campaign.repository')
jest.mock('../money-donation.permission')
jest.mock('src/utils/qr-generator', () => ({
    generateVietQrUrl: jest.fn().mockReturnValue('https://qr.url'),
}))

describe('MoneyDonation Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('createMoneyPhase', () => {
        it('should throw NOT_FOUND if campaign not found', async () => {
            ;(campaignRepo.findCampaignById as jest.Mock).mockResolvedValue(null)

            await expect(
                moneyDonationService.createMoneyPhase('camp-1', {} as any, 'user-1', 'CLB')
            ).rejects.toThrow('Không tìm thấy chiến dịch')
        })

        it('should throw FORBIDDEN if permission denied', async () => {
            ;(campaignRepo.findCampaignById as jest.Mock).mockResolvedValue({ id: 'camp-1' })
            ;(canCreateMoneyPhase as jest.Mock).mockReturnValue({ allowed: false, message: 'No permission' })

            await expect(
                moneyDonationService.createMoneyPhase('camp-1', {} as any, 'user-1', 'CLB')
            ).rejects.toThrow('No permission')
        })

        it('should create money phase successfully', async () => {
            const mockCampaign = { id: 'camp-1', creatorId: 'user-1', status: 'DRAFT' }
            const mockPhase = { id: 1, campaignId: 'camp-1', targetAmount: BigInt(1000000) }
            ;(campaignRepo.findCampaignById as jest.Mock).mockResolvedValue(mockCampaign)
            ;(canCreateMoneyPhase as jest.Mock).mockReturnValue({ allowed: true })
            ;(moneyDonationRepo.createMoneyPhase as jest.Mock).mockResolvedValue(mockPhase)

            const result = await moneyDonationService.createMoneyPhase(
                'camp-1',
                {
                    targetAmount: 1000000,
                    bankCode: 'VCB',
                    bankAccountNo: '123456',
                    bankAccountName: 'Test',
                    startDate: new Date(),
                    endDate: new Date(),
                },
                'user-1',
                'CLB'
            )

            expect(result).toEqual(mockPhase)
            expect(moneyDonationRepo.createMoneyPhase).toHaveBeenCalledWith('camp-1', expect.objectContaining({
                targetAmount: 1000000,
                qrImageUrl: 'https://qr.url',
            }))
        })
    })

    describe('getMoneyPhaseById', () => {
        it('should throw NOT_FOUND if phase not found', async () => {
            ;(moneyDonationRepo.findMoneyPhaseById as jest.Mock).mockResolvedValue(null)

            await expect(moneyDonationService.getMoneyPhaseById(999)).rejects.toThrow('Không tìm thấy giai đoạn quyên góp')
        })

        it('should return money phase', async () => {
            const mockPhase = { id: 1, campaignId: 'camp-1' }
            ;(moneyDonationRepo.findMoneyPhaseById as jest.Mock).mockResolvedValue(mockPhase)

            const result = await moneyDonationService.getMoneyPhaseById(1)

            expect(result).toEqual(mockPhase)
        })
    })

    describe('updateMoneyPhase', () => {
        it('should throw NOT_FOUND if phase not found', async () => {
            ;(moneyDonationRepo.findMoneyPhaseById as jest.Mock).mockResolvedValue(null)

            await expect(
                moneyDonationService.updateMoneyPhase(1, {}, 'user-1', 'CLB')
            ).rejects.toThrow('Không tìm thấy giai đoạn quyên góp')
        })

        it('should throw FORBIDDEN if permission denied', async () => {
            const mockPhase = { id: 1, campaign: { creatorId: 'other-user' } }
            ;(moneyDonationRepo.findMoneyPhaseById as jest.Mock).mockResolvedValue(mockPhase)
            ;(canUpdateMoneyPhase as jest.Mock).mockReturnValue({ allowed: false, message: 'No permission' })

            await expect(
                moneyDonationService.updateMoneyPhase(1, {}, 'user-1', 'CLB')
            ).rejects.toThrow('No permission')
        })

        it('should update money phase successfully', async () => {
            const mockPhase = {
                id: 1,
                campaign: { creatorId: 'user-1', status: 'ACTIVE' },
                qrImageUrl: 'https://old.qr',
                bankCode: 'VCB',
                bankAccountNo: '123',
                bankAccountName: 'Test',
                targetAmount: BigInt(1000000),
            }
            const updatedPhase = { id: 1, targetAmount: BigInt(2000000) }
            ;(moneyDonationRepo.findMoneyPhaseById as jest.Mock).mockResolvedValue(mockPhase)
            ;(canUpdateMoneyPhase as jest.Mock).mockReturnValue({ allowed: true })
            ;(moneyDonationRepo.updateMoneyPhase as jest.Mock).mockResolvedValue(updatedPhase)

            const result = await moneyDonationService.updateMoneyPhase(1, { targetAmount: 2000000 }, 'user-1', 'CLB')

            expect(result).toEqual(updatedPhase)
            expect(moneyDonationRepo.updateMoneyPhase).toHaveBeenCalledWith(1, expect.objectContaining({
                targetAmount: 2000000,
            }))
        })

        it('should regenerate QR code when bank info changes', async () => {
            const mockPhase = {
                id: 1,
                campaign: { creatorId: 'user-1', status: 'ACTIVE' },
                qrImageUrl: 'https://old.qr',
                bankCode: 'VCB',
                bankAccountNo: '123',
                bankAccountName: 'Test',
                targetAmount: BigInt(1000000),
            }
            ;(moneyDonationRepo.findMoneyPhaseById as jest.Mock).mockResolvedValue(mockPhase)
            ;(canUpdateMoneyPhase as jest.Mock).mockReturnValue({ allowed: true })
            ;(moneyDonationRepo.updateMoneyPhase as jest.Mock).mockResolvedValue(mockPhase)

            await moneyDonationService.updateMoneyPhase(1, { bankCode: 'TCB' }, 'user-1', 'CLB')

            expect(moneyDonationRepo.updateMoneyPhase).toHaveBeenCalledWith(1, expect.objectContaining({
                qrImageUrl: 'https://qr.url',
            }))
        })
    })

    describe('deleteMoneyPhase', () => {
        it('should throw NOT_FOUND if phase not found', async () => {
            ;(moneyDonationRepo.findMoneyPhaseById as jest.Mock).mockResolvedValue(null)

            await expect(
                moneyDonationService.deleteMoneyPhase(1, 'user-1', 'CLB')
            ).rejects.toThrow('Không tìm thấy giai đoạn quyên góp')
        })

        it('should throw FORBIDDEN if permission denied', async () => {
            const mockPhase = { id: 1, campaign: { creatorId: 'other-user' } }
            ;(moneyDonationRepo.findMoneyPhaseById as jest.Mock).mockResolvedValue(mockPhase)
            ;(moneyDonationRepo.countDonationsByPhase as jest.Mock).mockResolvedValue(0)
            ;(canDeleteMoneyPhase as jest.Mock).mockReturnValue({ allowed: false, message: 'No permission' })

            await expect(
                moneyDonationService.deleteMoneyPhase(1, 'user-1', 'CLB')
            ).rejects.toThrow('No permission')
        })

        it('should delete money phase successfully', async () => {
            const mockPhase = { id: 1, campaign: { creatorId: 'user-1', status: 'DRAFT' } }
            ;(moneyDonationRepo.findMoneyPhaseById as jest.Mock).mockResolvedValue(mockPhase)
            ;(moneyDonationRepo.countDonationsByPhase as jest.Mock).mockResolvedValue(0)
            ;(canDeleteMoneyPhase as jest.Mock).mockReturnValue({ allowed: true })
            ;(moneyDonationRepo.softDeleteMoneyPhase as jest.Mock).mockResolvedValue({ id: 1 })

            const result = await moneyDonationService.deleteMoneyPhase(1, 'user-1', 'CLB')

            expect(result.message).toBe('Xóa giai đoạn quyên góp thành công')
            expect(moneyDonationRepo.softDeleteMoneyPhase).toHaveBeenCalledWith(1)
        })
    })

    describe('getPhaseProgress', () => {
        it('should throw NOT_FOUND if phase not found', async () => {
            ;(moneyDonationRepo.findMoneyPhaseById as jest.Mock).mockResolvedValue(null)

            await expect(moneyDonationService.getPhaseProgress(1)).rejects.toThrow('Không tìm thấy giai đoạn quyên góp')
        })

        it('should throw FORBIDDEN if cannot view progress', async () => {
            const mockPhase = { id: 1, campaign: { status: 'DRAFT' } }
            ;(moneyDonationRepo.findMoneyPhaseById as jest.Mock).mockResolvedValue(mockPhase)
            ;(canViewProgress as jest.Mock).mockReturnValue({ allowed: false, message: 'Cannot view' })

            await expect(moneyDonationService.getPhaseProgress(1)).rejects.toThrow('Cannot view')
        })

        it('should throw NOT_FOUND if progress not found', async () => {
            const mockPhase = { id: 1, campaign: { status: 'ACTIVE' } }
            ;(moneyDonationRepo.findMoneyPhaseById as jest.Mock).mockResolvedValue(mockPhase)
            ;(canViewProgress as jest.Mock).mockReturnValue({ allowed: true })
            ;(moneyDonationRepo.getPhaseProgress as jest.Mock).mockResolvedValue(null)

            await expect(moneyDonationService.getPhaseProgress(1)).rejects.toThrow('Không tìm thấy tiến độ')
        })

        it('should return phase progress', async () => {
            const mockPhase = { id: 1, campaign: { status: 'ACTIVE' } }
            const mockProgress = { phaseId: 1, targetAmount: '1000000', currentAmount: '500000', percentage: 50 }
            ;(moneyDonationRepo.findMoneyPhaseById as jest.Mock).mockResolvedValue(mockPhase)
            ;(canViewProgress as jest.Mock).mockReturnValue({ allowed: true })
            ;(moneyDonationRepo.getPhaseProgress as jest.Mock).mockResolvedValue(mockProgress)

            const result = await moneyDonationService.getPhaseProgress(1)

            expect(result).toEqual(mockProgress)
        })
    })

    describe('getPhaseDonations', () => {
        it('should throw NOT_FOUND if phase not found', async () => {
            ;(moneyDonationRepo.findMoneyPhaseById as jest.Mock).mockResolvedValue(null)

            await expect(
                moneyDonationService.getPhaseDonations(1, {}, 'user-1', 'CLB')
            ).rejects.toThrow('Không tìm thấy giai đoạn quyên góp')
        })

        it('should throw FORBIDDEN if permission denied', async () => {
            const mockPhase = { id: 1, campaign: { creatorId: 'other-user' } }
            ;(moneyDonationRepo.findMoneyPhaseById as jest.Mock).mockResolvedValue(mockPhase)
            ;(canViewPhaseDonations as jest.Mock).mockReturnValue({ allowed: false, message: 'No permission' })

            await expect(
                moneyDonationService.getPhaseDonations(1, {}, 'user-1', 'CLB')
            ).rejects.toThrow('No permission')
        })

        it('should return donations', async () => {
            const mockPhase = { id: 1, campaign: { creatorId: 'user-1' } }
            const mockDonations = { donations: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }
            ;(moneyDonationRepo.findMoneyPhaseById as jest.Mock).mockResolvedValue(mockPhase)
            ;(canViewPhaseDonations as jest.Mock).mockReturnValue({ allowed: true })
            ;(moneyDonationRepo.findDonationsByPhase as jest.Mock).mockResolvedValue(mockDonations)

            const result = await moneyDonationService.getPhaseDonations(1, { page: 1, limit: 10 }, 'user-1', 'CLB')

            expect(result).toEqual(mockDonations)
            expect(moneyDonationRepo.findDonationsByPhase).toHaveBeenCalledWith(1, { page: 1, limit: 10 })
        })
    })
})