jest.mock('src/config', () => ({
    prismaClient: {
        itemDonationCampaign: {
            findUnique: jest.fn(),
        },
        donation: {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
    },
}))

import { prismaClient } from 'src/config'
import * as itemDonationRepository from '../item-donation.repository'

describe('ItemDonation Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('findItemPhaseById', () => {
        it('should find item phase by id with campaign', async () => {
            const mockPhase = {
                id: 1,
                startDate: null,
                endDate: null,
                campaign: { id: 'campaign-1', title: 'Test Campaign' },
            }
            ;(prismaClient.itemDonationCampaign.findUnique as jest.Mock).mockResolvedValue(mockPhase)

            const result = await itemDonationRepository.findItemPhaseById(1)

            expect(prismaClient.itemDonationCampaign.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                include: { campaign: true },
            })
            expect(result).toEqual(mockPhase)
        })

        it('should return null when item phase not found', async () => {
            ;(prismaClient.itemDonationCampaign.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await itemDonationRepository.findItemPhaseById(999)

            expect(prismaClient.itemDonationCampaign.findUnique).toHaveBeenCalledWith({
                where: { id: 999 },
                include: { campaign: true },
            })
            expect(result).toBeNull()
        })

        it('should return phase with all fields', async () => {
            const mockPhase = {
                id: 1,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-31'),
                campaign: {
                    id: 'campaign-1',
                    title: 'Test Campaign',
                    creatorId: 'user-1',
                },
            }
            ;(prismaClient.itemDonationCampaign.findUnique as jest.Mock).mockResolvedValue(mockPhase)

            const result = await itemDonationRepository.findItemPhaseById(1)

            expect(result).toEqual(mockPhase)
            expect(result?.campaign.creatorId).toBe('user-1')
        })
    })

    describe('createItemDonation', () => {
        it('should create item donation without proofImageUrl', async () => {
            const mockDonation = {
                id: 'don-1',
                studentId: 'student-1',
                itemPhaseId: 1,
                itemDescription: 'Sách giáo khoa',
                proofImageUrl: null,
                status: 'PENDING',
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            ;(prismaClient.donation.create as jest.Mock).mockResolvedValue(mockDonation)

            const result = await itemDonationRepository.createItemDonation('student-1', {
                itemPhaseId: 1,
                itemDescription: 'Sách giáo khoa',
            })

            expect(prismaClient.donation.create).toHaveBeenCalledWith({
                data: {
                    studentId: 'student-1',
                    itemPhaseId: 1,
                    itemDescription: 'Sách giáo khoa',
                    proofImageUrl: undefined,
                },
            })
            expect(result).toEqual(mockDonation)
        })

        it('should create item donation with proofImageUrl', async () => {
            const mockDonation = {
                id: 'don-1',
                studentId: 'student-1',
                itemPhaseId: 1,
                itemDescription: 'Quần áo',
                proofImageUrl: 'https://example.com/proof.jpg',
                status: 'PENDING',
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            ;(prismaClient.donation.create as jest.Mock).mockResolvedValue(mockDonation)

            const result = await itemDonationRepository.createItemDonation('student-1', {
                itemPhaseId: 1,
                itemDescription: 'Quần áo',
                proofImageUrl: 'https://example.com/proof.jpg',
            })

            expect(prismaClient.donation.create).toHaveBeenCalledWith({
                data: {
                    studentId: 'student-1',
                    itemPhaseId: 1,
                    itemDescription: 'Quần áo',
                    proofImageUrl: 'https://example.com/proof.jpg',
                },
            })
            expect(result).toEqual(mockDonation)
        })

        it('should return created donation with all fields', async () => {
            const mockDonation = {
                id: 'don-1',
                studentId: 'student-1',
                itemPhaseId: 1,
                itemDescription: 'Sách cũ',
                proofImageUrl: null,
                status: 'PENDING',
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
            }
            ;(prismaClient.donation.create as jest.Mock).mockResolvedValue(mockDonation)

            const result = await itemDonationRepository.createItemDonation('student-1', {
                itemPhaseId: 1,
                itemDescription: 'Sách cũ',
            })

            expect(result.id).toBe('don-1')
            expect(result.status).toBe('PENDING')
            expect(result.studentId).toBe('student-1')
        })
    })

    describe('findDonationsByPhaseId', () => {
        it('should return paginated donations with default values', async () => {
            const mockDonations = [
                {
                    id: 'don-1',
                    studentId: 'student-1',
                    itemDescription: 'Sách',
                    status: 'PENDING',
                    student: {
                        id: 'student-1',
                        mssv: '20120001',
                        fullName: 'Nguyen Van A',
                        email: 'a@example.com',
                    },
                },
            ]
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue(mockDonations)
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(1)

            const result = await itemDonationRepository.findDonationsByPhaseId(1, {})

            expect(prismaClient.donation.findMany).toHaveBeenCalledWith({
                where: { itemPhaseId: 1 },
                include: {
                    student: {
                        select: {
                            id: true,
                            mssv: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 10,
            })
            expect(result).toEqual({
                items: mockDonations,
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 1,
                    totalPages: 1,
                },
            })
        })

        it('should return paginated donations with custom page and limit', async () => {
            const mockDonations = []
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue(mockDonations)
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)

            const result = await itemDonationRepository.findDonationsByPhaseId(1, {
                page: 2,
                limit: 5,
            })

            expect(prismaClient.donation.findMany).toHaveBeenCalledWith({
                where: { itemPhaseId: 1 },
                include: {
                    student: {
                        select: {
                            id: true,
                            mssv: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: 5,
                take: 5,
            })
            expect(result.pagination).toEqual({
                page: 2,
                limit: 5,
                total: 0,
                totalPages: 0,
            })
        })

        it('should filter by status when provided', async () => {
            const mockDonations = [
                {
                    id: 'don-1',
                    status: 'VERIFIED',
                    student: { id: 'student-1' },
                },
            ]
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue(mockDonations)
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(1)

            const result = await itemDonationRepository.findDonationsByPhaseId(1, {
                status: 'VERIFIED',
            })

            expect(prismaClient.donation.findMany).toHaveBeenCalledWith({
                where: { itemPhaseId: 1, status: 'VERIFIED' },
                include: {
                    student: {
                        select: {
                            id: true,
                            mssv: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 10,
            })
            expect(result.items).toHaveLength(1)
        })

        it('should calculate correct total pages', async () => {
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(25)

            const result = await itemDonationRepository.findDonationsByPhaseId(1, {
                limit: 10,
            })

            expect(result.pagination.totalPages).toBe(3)
        })

        it('should handle empty results', async () => {
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)

            const result = await itemDonationRepository.findDonationsByPhaseId(1, {})

            expect(result.items).toEqual([])
            expect(result.pagination.total).toBe(0)
            expect(result.pagination.totalPages).toBe(0)
        })

        it('should return donations ordered by createdAt descending', async () => {
            const mockDonations = [
                {
                    id: 'don-2',
                    createdAt: new Date('2024-01-02'),
                    student: { id: 'student-1' },
                },
                {
                    id: 'don-1',
                    createdAt: new Date('2024-01-01'),
                    student: { id: 'student-2' },
                },
            ]
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue(mockDonations)
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(2)

            const result = await itemDonationRepository.findDonationsByPhaseId(1, {})

            expect(prismaClient.donation.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { createdAt: 'desc' },
                })
            )
            expect(result.items).toHaveLength(2)
        })

        it('should handle page 1 correctly with skip calculation', async () => {
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)

            await itemDonationRepository.findDonationsByPhaseId(1, { page: 1, limit: 20 })

            expect(prismaClient.donation.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 0,
                    take: 20,
                })
            )
        })

        it('should handle page 3 correctly with skip calculation', async () => {
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)

            await itemDonationRepository.findDonationsByPhaseId(1, { page: 3, limit: 10 })

            expect(prismaClient.donation.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 20,
                    take: 10,
                })
            )
        })

        it('should include student information in donations', async () => {
            const mockDonations = [
                {
                    id: 'don-1',
                    studentId: 'student-1',
                    student: {
                        id: 'student-1',
                        mssv: '20120001',
                        fullName: 'Nguyen Van A',
                        email: 'a@example.com',
                    },
                },
            ]
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue(mockDonations)
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(1)

            const result = await itemDonationRepository.findDonationsByPhaseId(1, {})

            expect(result.items[0].student).toBeDefined()
            expect(result.items[0].student.mssv).toBe('20120001')
            expect(result.items[0].student.fullName).toBe('Nguyen Van A')
        })

        it('should filter by PENDING status', async () => {
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)

            await itemDonationRepository.findDonationsByPhaseId(1, { status: 'PENDING' })

            expect(prismaClient.donation.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        itemPhaseId: 1,
                        status: 'PENDING',
                    }),
                })
            )
        })

        it('should filter by VERIFIED status', async () => {
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)

            await itemDonationRepository.findDonationsByPhaseId(1, { status: 'VERIFIED' })

            expect(prismaClient.donation.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        itemPhaseId: 1,
                        status: 'VERIFIED',
                    }),
                })
            )
        })

        it('should filter by REJECTED status', async () => {
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(0)

            await itemDonationRepository.findDonationsByPhaseId(1, { status: 'REJECTED' })

            expect(prismaClient.donation.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        itemPhaseId: 1,
                        status: 'REJECTED',
                    }),
                })
            )
        })

        it('should handle all parameters combined', async () => {
            ;(prismaClient.donation.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.donation.count as jest.Mock).mockResolvedValue(100)

            const result = await itemDonationRepository.findDonationsByPhaseId(5, {
                status: 'PENDING',
                page: 3,
                limit: 25,
            })

            expect(prismaClient.donation.findMany).toHaveBeenCalledWith({
                where: { itemPhaseId: 5, status: 'PENDING' },
                include: {
                    student: {
                        select: {
                            id: true,
                            mssv: true,
                            fullName: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: 50,
                take: 25,
            })
            expect(result.pagination.totalPages).toBe(4)
        })
    })
})