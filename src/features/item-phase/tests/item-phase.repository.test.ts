jest.mock('src/config', () => ({
    prismaClient: {
        campaign: {
            findUnique: jest.fn(),
        },
        itemDonationCampaign: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        donation: {
            count: jest.fn(),
        },
    },
}))

import { prismaClient } from 'src/config'
import * as itemPhaseRepository from '../item-phase.repository'

describe('ItemPhase Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('findCampaignById', () => {
        it('should find campaign by id', async () => {
            const mockCampaign = { id: 'campaign-1', title: 'Test Campaign', creatorId: 'user-1' }
            ;(prismaClient.campaign.findUnique as jest.Mock).mockResolvedValue(mockCampaign)

            const result = await itemPhaseRepository.findCampaignById('campaign-1')

            expect(prismaClient.campaign.findUnique).toHaveBeenCalledWith({
                where: { id: 'campaign-1', deletedAt: null },
            })
            expect(result).toEqual(mockCampaign)
        })

        it('should return null when campaign not found', async () => {
            ;(prismaClient.campaign.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await itemPhaseRepository.findCampaignById('nonexistent')

            expect(result).toBeNull()
        })
    })

    describe('findItemPhaseByCampaignId', () => {
        it('should find item phase by campaign id', async () => {
            const mockItemPhase = {
                id: 1,
                campaignId: 'campaign-1',
                acceptedItems: JSON.stringify(['Book', 'Clothes']),
                collectionAddress: 'Address 1',
            }
            ;(prismaClient.itemDonationCampaign.findUnique as jest.Mock).mockResolvedValue(mockItemPhase)

            const result = await itemPhaseRepository.findItemPhaseByCampaignId('campaign-1')

            expect(prismaClient.itemDonationCampaign.findUnique).toHaveBeenCalledWith({
                where: { campaignId: 'campaign-1' },
            })
            expect(result).toEqual(mockItemPhase)
        })

        it('should return null when item phase not found', async () => {
            ;(prismaClient.itemDonationCampaign.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await itemPhaseRepository.findItemPhaseByCampaignId('campaign-1')

            expect(result).toBeNull()
        })
    })

    describe('findItemPhaseById', () => {
        it('should find item phase by id', async () => {
            const mockItemPhase = {
                id: 1,
                campaignId: 'campaign-1',
                acceptedItems: JSON.stringify(['Book']),
                collectionAddress: 'Address 1',
            }
            ;(prismaClient.itemDonationCampaign.findUnique as jest.Mock).mockResolvedValue(mockItemPhase)

            const result = await itemPhaseRepository.findItemPhaseById(1)

            expect(prismaClient.itemDonationCampaign.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
            })
            expect(result).toEqual(mockItemPhase)
        })

        it('should return null when item phase not found', async () => {
            ;(prismaClient.itemDonationCampaign.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await itemPhaseRepository.findItemPhaseById(999)

            expect(result).toBeNull()
        })
    })

    describe('createItemPhase', () => {
        it('should create item phase with all fields', async () => {
            const mockItemPhase = {
                id: 1,
                campaignId: 'campaign-1',
                acceptedItems: JSON.stringify(['Book', 'Clothes']),
                collectionAddress: 'Address 1',
                startDate: new Date('2024-12-01'),
                endDate: new Date('2024-12-31'),
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            ;(prismaClient.itemDonationCampaign.create as jest.Mock).mockResolvedValue(mockItemPhase)

            const data = {
                acceptedItems: ['Book', 'Clothes'],
                collectionAddress: 'Address 1',
                startDate: new Date('2024-12-01'),
                endDate: new Date('2024-12-31'),
            }

            const result = await itemPhaseRepository.createItemPhase('campaign-1', data)

            expect(prismaClient.itemDonationCampaign.create).toHaveBeenCalledWith({
                data: {
                    campaignId: 'campaign-1',
                    acceptedItems: JSON.stringify(['Book', 'Clothes']),
                    collectionAddress: 'Address 1',
                    startDate: data.startDate,
                    endDate: data.endDate,
                },
            })
            expect(result).toEqual(mockItemPhase)
        })

        it('should create item phase with only required fields', async () => {
            const mockItemPhase = {
                id: 1,
                campaignId: 'campaign-1',
                acceptedItems: JSON.stringify(['Book']),
                collectionAddress: null,
                startDate: null,
                endDate: null,
            }
            ;(prismaClient.itemDonationCampaign.create as jest.Mock).mockResolvedValue(mockItemPhase)

            const data = {
                acceptedItems: ['Book'],
            }

            const result = await itemPhaseRepository.createItemPhase('campaign-1', data)

            expect(prismaClient.itemDonationCampaign.create).toHaveBeenCalledWith({
                data: {
                    campaignId: 'campaign-1',
                    acceptedItems: JSON.stringify(['Book']),
                    collectionAddress: undefined,
                    startDate: undefined,
                    endDate: undefined,
                },
            })
            expect(result).toEqual(mockItemPhase)
        })
    })

    describe('updateItemPhase', () => {
        it('should update only acceptedItems', async () => {
            const mockItemPhase = {
                id: 1,
                campaignId: 'campaign-1',
                acceptedItems: JSON.stringify(['Book', 'Clothes', 'Toys']),
                collectionAddress: 'Old Address',
            }
            ;(prismaClient.itemDonationCampaign.update as jest.Mock).mockResolvedValue(mockItemPhase)

            const result = await itemPhaseRepository.updateItemPhase(1, {
                acceptedItems: ['Book', 'Clothes', 'Toys'],
            })

            expect(prismaClient.itemDonationCampaign.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    acceptedItems: JSON.stringify(['Book', 'Clothes', 'Toys']),
                },
            })
            expect(result).toEqual(mockItemPhase)
        })

        it('should update multiple fields', async () => {
            const mockItemPhase = {
                id: 1,
                campaignId: 'campaign-1',
                acceptedItems: JSON.stringify(['Book']),
                collectionAddress: 'New Address',
                startDate: new Date('2024-12-01'),
                endDate: new Date('2024-12-31'),
            }
            ;(prismaClient.itemDonationCampaign.update as jest.Mock).mockResolvedValue(mockItemPhase)

            const result = await itemPhaseRepository.updateItemPhase(1, {
                collectionAddress: 'New Address',
                startDate: new Date('2024-12-01'),
                endDate: new Date('2024-12-31'),
            })

            expect(prismaClient.itemDonationCampaign.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {
                    collectionAddress: 'New Address',
                    startDate: new Date('2024-12-01'),
                    endDate: new Date('2024-12-31'),
                },
            })
            expect(result).toEqual(mockItemPhase)
        })

        it('should handle empty update data', async () => {
            const mockItemPhase = {
                id: 1,
                campaignId: 'campaign-1',
                acceptedItems: JSON.stringify(['Book']),
            }
            ;(prismaClient.itemDonationCampaign.update as jest.Mock).mockResolvedValue(mockItemPhase)

            const result = await itemPhaseRepository.updateItemPhase(1, {})

            expect(prismaClient.itemDonationCampaign.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: {},
            })
            expect(result).toEqual(mockItemPhase)
        })
    })

    describe('deleteItemPhase', () => {
        it('should delete item phase by id', async () => {
            const mockItemPhase = {
                id: 1,
                campaignId: 'campaign-1',
                acceptedItems: JSON.stringify(['Book']),
            }
            ;(prismaClient.itemDonationCampaign.delete as jest.Mock).mockResolvedValue(mockItemPhase)

            const result = await itemPhaseRepository.deleteItemPhase(1)

            expect(prismaClient.itemDonationCampaign.delete).toHaveBeenCalledWith({
                where: { id: 1 },
            })
            expect(result).toEqual(mockItemPhase)
        })
    })

    describe('countDonationsByPhaseId', () => {
        it('should count donations for a phase', async () => {
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(5)

            const result = await itemPhaseRepository.countDonationsByPhaseId(1)

            expect(prismaClient.donation.count).toHaveBeenCalledWith({
                where: { itemPhaseId: 1 },
            })
            expect(result).toBe(5)
        })

        it('should return 0 when no donations', async () => {
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)

            const result = await itemPhaseRepository.countDonationsByPhaseId(999)

            expect(result).toBe(0)
        })
    })
})