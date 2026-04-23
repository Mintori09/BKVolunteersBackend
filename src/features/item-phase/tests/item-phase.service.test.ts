import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import * as itemPhaseRepository from '../item-phase.repository'
import * as itemPhaseService from '../item-phase.service'

jest.mock('../item-phase.repository')

describe('ItemPhase Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('createItemPhase', () => {
        it('should throw NOT_FOUND if campaign not found', async () => {
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue(null)

            await expect(
                itemPhaseService.createItemPhase('campaign-1', 'user-1', {
                    acceptedItems: ['Book'],
                })
            ).rejects.toThrow(ApiError)
            await expect(
                itemPhaseService.createItemPhase('campaign-1', 'user-1', {
                    acceptedItems: ['Book'],
                })
            ).rejects.toHaveProperty('statusCode', HttpStatus.NOT_FOUND)
        })

        it('should throw FORBIDDEN if user is not campaign creator', async () => {
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 'campaign-1',
                creatorId: 'other-user',
            })

            await expect(
                itemPhaseService.createItemPhase('campaign-1', 'user-1', {
                    acceptedItems: ['Book'],
                })
            ).rejects.toThrow(ApiError)
            await expect(
                itemPhaseService.createItemPhase('campaign-1', 'user-1', {
                    acceptedItems: ['Book'],
                })
            ).rejects.toHaveProperty('statusCode', HttpStatus.FORBIDDEN)
        })

        it('should throw CONFLICT if item phase already exists for campaign', async () => {
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 'campaign-1',
                creatorId: 'user-1',
            })
            ;(itemPhaseRepository.findItemPhaseByCampaignId as jest.Mock).mockResolvedValue({
                id: 1,
                campaignId: 'campaign-1',
            })

            await expect(
                itemPhaseService.createItemPhase('campaign-1', 'user-1', {
                    acceptedItems: ['Book'],
                })
            ).rejects.toThrow(ApiError)
            await expect(
                itemPhaseService.createItemPhase('campaign-1', 'user-1', {
                    acceptedItems: ['Book'],
                })
            ).rejects.toHaveProperty('statusCode', HttpStatus.CONFLICT)
        })

        it('should throw BAD_REQUEST if startDate >= endDate', async () => {
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 'campaign-1',
                creatorId: 'user-1',
            })
            ;(itemPhaseRepository.findItemPhaseByCampaignId as jest.Mock).mockResolvedValue(null)

            await expect(
                itemPhaseService.createItemPhase('campaign-1', 'user-1', {
                    acceptedItems: ['Book'],
                    startDate: new Date('2024-12-31'),
                    endDate: new Date('2024-12-01'),
                })
            ).rejects.toThrow(ApiError)
            await expect(
                itemPhaseService.createItemPhase('campaign-1', 'user-1', {
                    acceptedItems: ['Book'],
                    startDate: new Date('2024-12-31'),
                    endDate: new Date('2024-12-01'),
                })
            ).rejects.toHaveProperty('statusCode', HttpStatus.BAD_REQUEST)
        })

        it('should create item phase successfully', async () => {
            const mockItemPhase = {
                id: 1,
                campaignId: 'campaign-1',
                acceptedItems: JSON.stringify(['Book', 'Clothes']),
                collectionAddress: 'Address 1',
            }
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 'campaign-1',
                creatorId: 'user-1',
            })
            ;(itemPhaseRepository.findItemPhaseByCampaignId as jest.Mock).mockResolvedValue(null)
            ;(itemPhaseRepository.createItemPhase as jest.Mock).mockResolvedValue(mockItemPhase)

            const result = await itemPhaseService.createItemPhase('campaign-1', 'user-1', {
                acceptedItems: ['Book', 'Clothes'],
                collectionAddress: 'Address 1',
            })

            expect(result).toEqual(mockItemPhase)
            expect(itemPhaseRepository.createItemPhase).toHaveBeenCalledWith('campaign-1', {
                acceptedItems: ['Book', 'Clothes'],
                collectionAddress: 'Address 1',
            })
        })

        it('should create item phase with dates', async () => {
            const startDate = new Date('2024-12-01')
            const endDate = new Date('2024-12-31')
            const mockItemPhase = {
                id: 1,
                campaignId: 'campaign-1',
                acceptedItems: JSON.stringify(['Book']),
                startDate,
                endDate,
            }
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 'campaign-1',
                creatorId: 'user-1',
            })
            ;(itemPhaseRepository.findItemPhaseByCampaignId as jest.Mock).mockResolvedValue(null)
            ;(itemPhaseRepository.createItemPhase as jest.Mock).mockResolvedValue(mockItemPhase)

            const result = await itemPhaseService.createItemPhase('campaign-1', 'user-1', {
                acceptedItems: ['Book'],
                startDate,
                endDate,
            })

            expect(result).toEqual(mockItemPhase)
        })
    })

    describe('getItemPhaseByCampaignId', () => {
        it('should return item phase by campaign id', async () => {
            ;(itemPhaseRepository.findItemPhaseByCampaignId as jest.Mock).mockResolvedValue({
                id: 1,
                campaignId: 'campaign-1',
                acceptedItems: JSON.stringify(['Book']),
            })

            const result =
                await itemPhaseService.getItemPhaseByCampaignId('campaign-1')

            expect(itemPhaseRepository.findItemPhaseByCampaignId).toHaveBeenCalledWith(
                'campaign-1'
            )
            expect(result.id).toBe(1)
        })

        it('should throw NOT_FOUND when item phase does not exist', async () => {
            ;(itemPhaseRepository.findItemPhaseByCampaignId as jest.Mock).mockResolvedValue(
                null
            )

            await expect(
                itemPhaseService.getItemPhaseByCampaignId('campaign-1')
            ).rejects.toThrow(ApiError)
            await expect(
                itemPhaseService.getItemPhaseByCampaignId('campaign-1')
            ).rejects.toHaveProperty('statusCode', HttpStatus.NOT_FOUND)
        })
    })

    describe('updateItemPhase', () => {
        it('should throw NOT_FOUND if campaign not found', async () => {
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue(null)

            await expect(
                itemPhaseService.updateItemPhase('campaign-1', 1, 'user-1', { acceptedItems: ['Book'] })
            ).rejects.toThrow(ApiError)
            await expect(
                itemPhaseService.updateItemPhase('campaign-1', 1, 'user-1', { acceptedItems: ['Book'] })
            ).rejects.toHaveProperty('statusCode', HttpStatus.NOT_FOUND)
        })

        it('should throw FORBIDDEN if user is not campaign creator', async () => {
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 'campaign-1',
                creatorId: 'other-user',
            })

            await expect(
                itemPhaseService.updateItemPhase('campaign-1', 1, 'user-1', { acceptedItems: ['Book'] })
            ).rejects.toThrow(ApiError)
            await expect(
                itemPhaseService.updateItemPhase('campaign-1', 1, 'user-1', { acceptedItems: ['Book'] })
            ).rejects.toHaveProperty('statusCode', HttpStatus.FORBIDDEN)
        })

        it('should throw NOT_FOUND if item phase not found', async () => {
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 'campaign-1',
                creatorId: 'user-1',
            })
            ;(itemPhaseRepository.findItemPhaseById as jest.Mock).mockResolvedValue(null)

            await expect(
                itemPhaseService.updateItemPhase('campaign-1', 1, 'user-1', { acceptedItems: ['Book'] })
            ).rejects.toThrow(ApiError)
            await expect(
                itemPhaseService.updateItemPhase('campaign-1', 1, 'user-1', { acceptedItems: ['Book'] })
            ).rejects.toHaveProperty('statusCode', HttpStatus.NOT_FOUND)
        })

        it('should throw BAD_REQUEST if phase does not belong to campaign', async () => {
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 'campaign-1',
                creatorId: 'user-1',
            })
            ;(itemPhaseRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                campaignId: 'different-campaign',
            })

            await expect(
                itemPhaseService.updateItemPhase('campaign-1', 1, 'user-1', { acceptedItems: ['Book'] })
            ).rejects.toThrow(ApiError)
            await expect(
                itemPhaseService.updateItemPhase('campaign-1', 1, 'user-1', { acceptedItems: ['Book'] })
            ).rejects.toHaveProperty('statusCode', HttpStatus.BAD_REQUEST)
        })

        it('should throw BAD_REQUEST if startDate >= endDate after update', async () => {
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 'campaign-1',
                creatorId: 'user-1',
            })
            ;(itemPhaseRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                campaignId: 'campaign-1',
                startDate: new Date('2024-12-01'),
                endDate: new Date('2024-12-31'),
            })

            await expect(
                itemPhaseService.updateItemPhase('campaign-1', 1, 'user-1', {
                    startDate: new Date('2024-12-31'),
                    endDate: new Date('2024-12-01'),
                })
            ).rejects.toThrow(ApiError)
            await expect(
                itemPhaseService.updateItemPhase('campaign-1', 1, 'user-1', {
                    startDate: new Date('2024-12-31'),
                    endDate: new Date('2024-12-01'),
                })
            ).rejects.toHaveProperty('statusCode', HttpStatus.BAD_REQUEST)
        })

        it('should update item phase successfully', async () => {
            const mockItemPhase = {
                id: 1,
                campaignId: 'campaign-1',
                acceptedItems: JSON.stringify(['Book', 'Clothes']),
                collectionAddress: 'New Address',
            }
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 'campaign-1',
                creatorId: 'user-1',
            })
            ;(itemPhaseRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                campaignId: 'campaign-1',
                startDate: null,
                endDate: null,
            })
            ;(itemPhaseRepository.updateItemPhase as jest.Mock).mockResolvedValue(mockItemPhase)

            const result = await itemPhaseService.updateItemPhase('campaign-1', 1, 'user-1', {
                acceptedItems: ['Book', 'Clothes'],
                collectionAddress: 'New Address',
            })

            expect(result).toEqual(mockItemPhase)
            expect(itemPhaseRepository.updateItemPhase).toHaveBeenCalledWith(1, {
                acceptedItems: ['Book', 'Clothes'],
                collectionAddress: 'New Address',
            })
        })

        it('should use existing dates when not provided in update', async () => {
            const existingStartDate = new Date('2024-12-01')
            const existingEndDate = new Date('2024-12-31')
            const mockItemPhase = {
                id: 1,
                campaignId: 'campaign-1',
                acceptedItems: JSON.stringify(['Book']),
            }
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 'campaign-1',
                creatorId: 'user-1',
            })
            ;(itemPhaseRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                campaignId: 'campaign-1',
                startDate: existingStartDate,
                endDate: existingEndDate,
            })
            ;(itemPhaseRepository.updateItemPhase as jest.Mock).mockResolvedValue(mockItemPhase)

            const result = await itemPhaseService.updateItemPhase('campaign-1', 1, 'user-1', {
                acceptedItems: ['Book'],
            })

            expect(result).toEqual(mockItemPhase)
        })
    })

    describe('deleteItemPhase', () => {
        it('should throw NOT_FOUND if campaign not found', async () => {
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue(null)

            await expect(
                itemPhaseService.deleteItemPhase('campaign-1', 1, 'user-1')
            ).rejects.toThrow(ApiError)
            await expect(
                itemPhaseService.deleteItemPhase('campaign-1', 1, 'user-1')
            ).rejects.toHaveProperty('statusCode', HttpStatus.NOT_FOUND)
        })

        it('should throw FORBIDDEN if user is not campaign creator', async () => {
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 'campaign-1',
                creatorId: 'other-user',
            })

            await expect(
                itemPhaseService.deleteItemPhase('campaign-1', 1, 'user-1')
            ).rejects.toThrow(ApiError)
            await expect(
                itemPhaseService.deleteItemPhase('campaign-1', 1, 'user-1')
            ).rejects.toHaveProperty('statusCode', HttpStatus.FORBIDDEN)
        })

        it('should throw NOT_FOUND if item phase not found', async () => {
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 'campaign-1',
                creatorId: 'user-1',
            })
            ;(itemPhaseRepository.findItemPhaseById as jest.Mock).mockResolvedValue(null)

            await expect(
                itemPhaseService.deleteItemPhase('campaign-1', 1, 'user-1')
            ).rejects.toThrow(ApiError)
            await expect(
                itemPhaseService.deleteItemPhase('campaign-1', 1, 'user-1')
            ).rejects.toHaveProperty('statusCode', HttpStatus.NOT_FOUND)
        })

        it('should throw BAD_REQUEST if phase does not belong to campaign', async () => {
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 'campaign-1',
                creatorId: 'user-1',
            })
            ;(itemPhaseRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                campaignId: 'different-campaign',
            })

            await expect(
                itemPhaseService.deleteItemPhase('campaign-1', 1, 'user-1')
            ).rejects.toThrow(ApiError)
            await expect(
                itemPhaseService.deleteItemPhase('campaign-1', 1, 'user-1')
            ).rejects.toHaveProperty('statusCode', HttpStatus.BAD_REQUEST)
        })

        it('should throw CONFLICT if phase has donations', async () => {
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 'campaign-1',
                creatorId: 'user-1',
            })
            ;(itemPhaseRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                campaignId: 'campaign-1',
            })
            ;(itemPhaseRepository.countDonationsByPhaseId as jest.Mock).mockResolvedValue(5)

            await expect(
                itemPhaseService.deleteItemPhase('campaign-1', 1, 'user-1')
            ).rejects.toThrow(ApiError)
            await expect(
                itemPhaseService.deleteItemPhase('campaign-1', 1, 'user-1')
            ).rejects.toHaveProperty('statusCode', HttpStatus.CONFLICT)
        })

        it('should delete item phase successfully', async () => {
            ;(itemPhaseRepository.findCampaignById as jest.Mock).mockResolvedValue({
                id: 'campaign-1',
                creatorId: 'user-1',
            })
            ;(itemPhaseRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                campaignId: 'campaign-1',
            })
            ;(itemPhaseRepository.countDonationsByPhaseId as jest.Mock).mockResolvedValue(0)
            ;(itemPhaseRepository.deleteItemPhase as jest.Mock).mockResolvedValue(undefined)

            await itemPhaseService.deleteItemPhase('campaign-1', 1, 'user-1')

            expect(itemPhaseRepository.deleteItemPhase).toHaveBeenCalledWith(1)
        })
    })
})
