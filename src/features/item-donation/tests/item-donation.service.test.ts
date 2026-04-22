import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import * as itemDonationRepository from '../item-donation.repository'
import * as itemDonationService from '../item-donation.service'

jest.mock('../item-donation.repository')

describe('ItemDonation Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('createItemDonation', () => {
        it('should throw NOT_FOUND if item phase not found', async () => {
            ;(itemDonationRepository.findItemPhaseById as jest.Mock).mockResolvedValue(null)

            await expect(
                itemDonationService.createItemDonation('student-1', {
                    itemPhaseId: 1,
                    itemDescription: 'Sách giáo khoa',
                })
            ).rejects.toThrow(ApiError)
            await expect(
                itemDonationService.createItemDonation('student-1', {
                    itemPhaseId: 1,
                    itemDescription: 'Sách giáo khoa',
                })
            ).rejects.toHaveProperty('statusCode', HttpStatus.NOT_FOUND)
        })

        it('should throw BAD_REQUEST if phase has not started yet', async () => {
            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + 7)
            ;(itemDonationRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                startDate: futureDate,
                endDate: null,
                campaign: { id: 'campaign-1' },
            })

            await expect(
                itemDonationService.createItemDonation('student-1', {
                    itemPhaseId: 1,
                    itemDescription: 'Sách giáo khoa',
                })
            ).rejects.toThrow(ApiError)
            await expect(
                itemDonationService.createItemDonation('student-1', {
                    itemPhaseId: 1,
                    itemDescription: 'Sách giáo khoa',
                })
            ).rejects.toHaveProperty('statusCode', HttpStatus.BAD_REQUEST)
        })

        it('should throw BAD_REQUEST if phase has already ended', async () => {
            const pastDate = new Date()
            pastDate.setDate(pastDate.getDate() - 7)
            ;(itemDonationRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                startDate: null,
                endDate: pastDate,
                campaign: { id: 'campaign-1' },
            })

            await expect(
                itemDonationService.createItemDonation('student-1', {
                    itemPhaseId: 1,
                    itemDescription: 'Sách giáo khoa',
                })
            ).rejects.toThrow(ApiError)
            await expect(
                itemDonationService.createItemDonation('student-1', {
                    itemPhaseId: 1,
                    itemDescription: 'Sách giáo khoa',
                })
            ).rejects.toHaveProperty('statusCode', HttpStatus.BAD_REQUEST)
        })

        it('should create item donation successfully without proofImageUrl', async () => {
            const mockDonation = {
                id: 'don-1',
                studentId: 'student-1',
                itemPhaseId: 1,
                itemDescription: 'Sách giáo khoa',
                proofImageUrl: null,
                status: 'PENDING',
            }
            ;(itemDonationRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                startDate: null,
                endDate: null,
                campaign: { id: 'campaign-1' },
            })
            ;(itemDonationRepository.createItemDonation as jest.Mock).mockResolvedValue(mockDonation)

            const result = await itemDonationService.createItemDonation('student-1', {
                itemPhaseId: 1,
                itemDescription: 'Sách giáo khoa',
            })

            expect(itemDonationRepository.findItemPhaseById).toHaveBeenCalledWith(1)
            expect(itemDonationRepository.createItemDonation).toHaveBeenCalledWith('student-1', {
                itemPhaseId: 1,
                itemDescription: 'Sách giáo khoa',
            })
            expect(result).toEqual(mockDonation)
        })

        it('should create item donation successfully with proofImageUrl', async () => {
            const mockDonation = {
                id: 'don-1',
                studentId: 'student-1',
                itemPhaseId: 1,
                itemDescription: 'Quần áo',
                proofImageUrl: 'https://example.com/proof.jpg',
                status: 'PENDING',
            }
            ;(itemDonationRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                startDate: null,
                endDate: null,
                campaign: { id: 'campaign-1' },
            })
            ;(itemDonationRepository.createItemDonation as jest.Mock).mockResolvedValue(mockDonation)

            const result = await itemDonationService.createItemDonation('student-1', {
                itemPhaseId: 1,
                itemDescription: 'Quần áo',
                proofImageUrl: 'https://example.com/proof.jpg',
            })

            expect(itemDonationRepository.createItemDonation).toHaveBeenCalledWith('student-1', {
                itemPhaseId: 1,
                itemDescription: 'Quần áo',
                proofImageUrl: 'https://example.com/proof.jpg',
            })
            expect(result).toEqual(mockDonation)
        })

        it('should allow donation when startDate is in the past', async () => {
            const pastDate = new Date()
            pastDate.setDate(pastDate.getDate() - 7)
            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + 7)
            const mockDonation = { id: 'don-1', status: 'PENDING' }
            ;(itemDonationRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                startDate: pastDate,
                endDate: futureDate,
                campaign: { id: 'campaign-1' },
            })
            ;(itemDonationRepository.createItemDonation as jest.Mock).mockResolvedValue(mockDonation)

            const result = await itemDonationService.createItemDonation('student-1', {
                itemPhaseId: 1,
                itemDescription: 'Sách',
            })

            expect(result).toEqual(mockDonation)
        })

        it('should allow donation when endDate is in the future', async () => {
            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + 7)
            const mockDonation = { id: 'don-1', status: 'PENDING' }
            ;(itemDonationRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                startDate: null,
                endDate: futureDate,
                campaign: { id: 'campaign-1' },
            })
            ;(itemDonationRepository.createItemDonation as jest.Mock).mockResolvedValue(mockDonation)

            const result = await itemDonationService.createItemDonation('student-1', {
                itemPhaseId: 1,
                itemDescription: 'Sách',
            })

            expect(result).toEqual(mockDonation)
        })

        it('should allow donation when both startDate and endDate are null', async () => {
            const mockDonation = { id: 'don-1', status: 'PENDING' }
            ;(itemDonationRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                startDate: null,
                endDate: null,
                campaign: { id: 'campaign-1' },
            })
            ;(itemDonationRepository.createItemDonation as jest.Mock).mockResolvedValue(mockDonation)

            const result = await itemDonationService.createItemDonation('student-1', {
                itemPhaseId: 1,
                itemDescription: 'Sách',
            })

            expect(result).toEqual(mockDonation)
        })
    })

    describe('getItemDonationsByPhase', () => {
        it('should throw NOT_FOUND if item phase not found', async () => {
            ;(itemDonationRepository.findItemPhaseById as jest.Mock).mockResolvedValue(null)

            await expect(
                itemDonationService.getItemDonationsByPhase(1, 'user-1', {})
            ).rejects.toThrow(ApiError)
            await expect(
                itemDonationService.getItemDonationsByPhase(1, 'user-1', {})
            ).rejects.toHaveProperty('statusCode', HttpStatus.NOT_FOUND)
        })

        it('should throw FORBIDDEN if user is not the campaign creator', async () => {
            ;(itemDonationRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                campaign: { id: 'campaign-1', creatorId: 'other-user' },
            })

            await expect(
                itemDonationService.getItemDonationsByPhase(1, 'user-1', {})
            ).rejects.toThrow(ApiError)
            await expect(
                itemDonationService.getItemDonationsByPhase(1, 'user-1', {})
            ).rejects.toHaveProperty('statusCode', HttpStatus.FORBIDDEN)
        })

        it('should return paginated donations for campaign creator', async () => {
            const mockResult = {
                items: [
                    { id: 'don-1', itemDescription: 'Sách', status: 'PENDING' },
                ],
                pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
            }
            ;(itemDonationRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                campaign: { id: 'campaign-1', creatorId: 'user-1' },
            })
            ;(itemDonationRepository.findDonationsByPhaseId as jest.Mock).mockResolvedValue(mockResult)

            const result = await itemDonationService.getItemDonationsByPhase(1, 'user-1', {})

            expect(itemDonationRepository.findItemPhaseById).toHaveBeenCalledWith(1)
            expect(itemDonationRepository.findDonationsByPhaseId).toHaveBeenCalledWith(1, {})
            expect(result).toEqual(mockResult)
        })

        it('should pass query parameters to repository', async () => {
            const mockResult = {
                items: [],
                pagination: { page: 2, limit: 5, total: 0, totalPages: 0 },
            }
            ;(itemDonationRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                campaign: { id: 'campaign-1', creatorId: 'user-1' },
            })
            ;(itemDonationRepository.findDonationsByPhaseId as jest.Mock).mockResolvedValue(mockResult)

            const result = await itemDonationService.getItemDonationsByPhase(1, 'user-1', {
                status: 'PENDING',
                page: 2,
                limit: 5,
            })

            expect(itemDonationRepository.findDonationsByPhaseId).toHaveBeenCalledWith(1, {
                status: 'PENDING',
                page: 2,
                limit: 5,
            })
            expect(result).toEqual(mockResult)
        })

        it('should allow access when user is the campaign creator', async () => {
            const mockResult = {
                items: [],
                pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
            }
            ;(itemDonationRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                campaign: { id: 'campaign-1', creatorId: 'user-1' },
            })
            ;(itemDonationRepository.findDonationsByPhaseId as jest.Mock).mockResolvedValue(mockResult)

            const result = await itemDonationService.getItemDonationsByPhase(1, 'user-1', {})

            expect(result).toEqual(mockResult)
        })

        it('should filter by status when provided', async () => {
            const mockResult = {
                items: [{ id: 'don-1', status: 'VERIFIED' }],
                pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
            }
            ;(itemDonationRepository.findItemPhaseById as jest.Mock).mockResolvedValue({
                id: 1,
                campaign: { id: 'campaign-1', creatorId: 'user-1' },
            })
            ;(itemDonationRepository.findDonationsByPhaseId as jest.Mock).mockResolvedValue(mockResult)

            const result = await itemDonationService.getItemDonationsByPhase(1, 'user-1', {
                status: 'VERIFIED',
            })

            expect(itemDonationRepository.findDonationsByPhaseId).toHaveBeenCalledWith(1, {
                status: 'VERIFIED',
            })
            expect(result).toEqual(mockResult)
        })
    })
})