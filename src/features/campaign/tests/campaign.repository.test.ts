import * as campaignRepository from '../campaign.repository'
import { CampaignStatus, CampaignScope } from '@prisma/client'

jest.mock('src/config/prisma', () => ({
    __esModule: true,
    default: {
        campaign: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
    },
}))

const mockPrismaClient = require('src/config/prisma').default

const createMockCampaign = (overrides = {}) => ({
    id: 'campaign-1',
    title: 'Test Campaign',
    description: 'Test Description',
    scope: 'TRUONG' as CampaignScope,
    status: 'DRAFT' as CampaignStatus,
    planFileUrl: null,
    budgetFileUrl: null,
    adminComment: null,
    approverId: null,
    creatorId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
})

describe('Campaign Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('createCampaign', () => {
        it('should create a campaign with creator relation', async () => {
            const input = {
                title: 'New Campaign',
                description: 'Description',
                scope: 'TRUONG' as CampaignScope,
                creatorId: 'user-1',
            }
            const mockCampaign = createMockCampaign(input)
            ;(mockPrismaClient.campaign.create as jest.Mock).mockResolvedValue(
                mockCampaign
            )

            const result = await campaignRepository.createCampaign(input)

            expect(mockPrismaClient.campaign.create).toHaveBeenCalledWith({
                data: {
                    title: input.title,
                    description: input.description,
                    scope: input.scope,
                    status: 'DRAFT',
                    creatorId: input.creatorId,
                },
                include: {
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            })
            expect(result).toEqual(mockCampaign)
        })

        it('should create campaign with KHOA scope', async () => {
            const input = {
                title: 'Faculty Campaign',
                description: 'Description',
                scope: 'KHOA' as CampaignScope,
                creatorId: 'user-1',
            }
            const mockCampaign = createMockCampaign(input)
            ;(mockPrismaClient.campaign.create as jest.Mock).mockResolvedValue(
                mockCampaign
            )

            const result = await campaignRepository.createCampaign(input)

            expect(result.scope).toBe('KHOA')
        })

        it('should throw error when database fails', async () => {
            const input = {
                title: 'New Campaign',
                scope: 'TRUONG' as CampaignScope,
                creatorId: 'user-1',
            }
            const dbError = new Error('Database error')
            ;(mockPrismaClient.campaign.create as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                campaignRepository.createCampaign(input)
            ).rejects.toThrow('Database error')
        })
    })

    describe('findCampaignById', () => {
        it('should return campaign with all relations', async () => {
            const mockCampaign = {
                ...createMockCampaign(),
                creator: {
                    id: 'user-1',
                    username: 'test',
                    email: 'test@test.com',
                    role: 'CLB',
                    facultyId: 'faculty-1',
                },
                approver: null,
                moneyPhase: [],
                itemPhase: [],
                eventPhase: [],
            }
            ;(
                mockPrismaClient.campaign.findUnique as jest.Mock
            ).mockResolvedValue(mockCampaign)

            const result =
                await campaignRepository.findCampaignById('campaign-1')

            expect(mockPrismaClient.campaign.findUnique).toHaveBeenCalledWith({
                where: { id: 'campaign-1' },
                include: {
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            role: true,
                            facultyId: true,
                        },
                    },
                    approver: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                    moneyPhase: true,
                    itemPhase: true,
                    eventPhase: true,
                },
            })
            expect(result).toEqual(mockCampaign)
        })

        it('should return null for non-existent campaign', async () => {
            ;(
                mockPrismaClient.campaign.findUnique as jest.Mock
            ).mockResolvedValue(null)

            const result =
                await campaignRepository.findCampaignById('non-existent')

            expect(result).toBeNull()
        })

        it('should throw error when database fails', async () => {
            const dbError = new Error('Database error')
            ;(
                mockPrismaClient.campaign.findUnique as jest.Mock
            ).mockRejectedValue(dbError)

            await expect(
                campaignRepository.findCampaignById('campaign-1')
            ).rejects.toThrow('Database error')
        })
    })

    describe('updateCampaign', () => {
        it('should update campaign title and description', async () => {
            const mockCampaign = createMockCampaign({
                title: 'Updated Title',
                description: 'Updated Description',
            })
            ;(mockPrismaClient.campaign.update as jest.Mock).mockResolvedValue(
                mockCampaign
            )

            const result = await campaignRepository.updateCampaign(
                'campaign-1',
                {
                    title: 'Updated Title',
                    description: 'Updated Description',
                }
            )

            expect(mockPrismaClient.campaign.update).toHaveBeenCalledWith({
                where: { id: 'campaign-1' },
                data: {
                    title: 'Updated Title',
                    description: 'Updated Description',
                },
                include: {
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            })
            expect(result.title).toBe('Updated Title')
        })

        it('should update only title', async () => {
            const mockCampaign = createMockCampaign({
                title: 'Only Title Updated',
            })
            ;(mockPrismaClient.campaign.update as jest.Mock).mockResolvedValue(
                mockCampaign
            )

            const result = await campaignRepository.updateCampaign(
                'campaign-1',
                {
                    title: 'Only Title Updated',
                }
            )

            expect(mockPrismaClient.campaign.update).toHaveBeenCalledWith({
                where: { id: 'campaign-1' },
                data: {
                    title: 'Only Title Updated',
                    description: undefined,
                },
                include: expect.any(Object),
            })
        })

        it('should throw error when campaign not found', async () => {
            const prismaError = new Error('Record not found')
            ;(mockPrismaClient.campaign.update as jest.Mock).mockRejectedValue(
                prismaError
            )

            await expect(
                campaignRepository.updateCampaign('non-existent', {
                    title: 'Updated',
                })
            ).rejects.toThrow('Record not found')
        })
    })

    describe('deleteCampaign', () => {
        it('should delete campaign by id', async () => {
            const mockCampaign = createMockCampaign()
            ;(mockPrismaClient.campaign.delete as jest.Mock).mockResolvedValue(
                mockCampaign
            )

            const result = await campaignRepository.deleteCampaign('campaign-1')

            expect(mockPrismaClient.campaign.delete).toHaveBeenCalledWith({
                where: { id: 'campaign-1' },
            })
            expect(result).toEqual(mockCampaign)
        })

        it('should throw error when campaign not found', async () => {
            const prismaError = new Error('Record not found')
            ;(mockPrismaClient.campaign.delete as jest.Mock).mockRejectedValue(
                prismaError
            )

            await expect(
                campaignRepository.deleteCampaign('non-existent')
            ).rejects.toThrow('Record not found')
        })
    })

    describe('updateCampaignStatus', () => {
        it('should update status to PENDING without approver', async () => {
            const mockCampaign = createMockCampaign({
                status: 'PENDING' as CampaignStatus,
            })
            ;(mockPrismaClient.campaign.update as jest.Mock).mockResolvedValue(
                mockCampaign
            )

            const result = await campaignRepository.updateCampaignStatus(
                'campaign-1',
                'PENDING'
            )

            expect(mockPrismaClient.campaign.update).toHaveBeenCalledWith({
                where: { id: 'campaign-1' },
                data: {
                    status: 'PENDING',
                    approverId: undefined,
                    adminComment: undefined,
                },
                include: {
                    creator: expect.any(Object),
                    approver: expect.any(Object),
                },
            })
            expect(result.status).toBe('PENDING')
        })

        it('should update status to ACTIVE with approver and comment', async () => {
            const mockCampaign = createMockCampaign({
                status: 'ACTIVE' as CampaignStatus,
                approverId: 'approver-1',
                adminComment: 'Approved!',
            })
            ;(mockPrismaClient.campaign.update as jest.Mock).mockResolvedValue(
                mockCampaign
            )

            const result = await campaignRepository.updateCampaignStatus(
                'campaign-1',
                'ACTIVE',
                {
                    approverId: 'approver-1',
                    adminComment: 'Approved!',
                }
            )

            expect(mockPrismaClient.campaign.update).toHaveBeenCalledWith({
                where: { id: 'campaign-1' },
                data: {
                    status: 'ACTIVE',
                    approverId: 'approver-1',
                    adminComment: 'Approved!',
                },
                include: expect.any(Object),
            })
            expect(result.status).toBe('ACTIVE')
        })

        it('should update status to REJECTED with comment', async () => {
            const mockCampaign = createMockCampaign({
                status: 'REJECTED' as CampaignStatus,
                adminComment: 'Not good enough',
            })
            ;(mockPrismaClient.campaign.update as jest.Mock).mockResolvedValue(
                mockCampaign
            )

            const result = await campaignRepository.updateCampaignStatus(
                'campaign-1',
                'REJECTED',
                {
                    approverId: 'approver-1',
                    adminComment: 'Not good enough',
                }
            )

            expect(result.status).toBe('REJECTED')
        })

        it('should update status to COMPLETED', async () => {
            const mockCampaign = createMockCampaign({
                status: 'COMPLETED' as CampaignStatus,
            })
            ;(mockPrismaClient.campaign.update as jest.Mock).mockResolvedValue(
                mockCampaign
            )

            const result = await campaignRepository.updateCampaignStatus(
                'campaign-1',
                'COMPLETED'
            )

            expect(result.status).toBe('COMPLETED')
        })

        it('should update status to CANCELLED', async () => {
            const mockCampaign = createMockCampaign({
                status: 'CANCELLED' as CampaignStatus,
            })
            ;(mockPrismaClient.campaign.update as jest.Mock).mockResolvedValue(
                mockCampaign
            )

            const result = await campaignRepository.updateCampaignStatus(
                'campaign-1',
                'CANCELLED'
            )

            expect(result.status).toBe('CANCELLED')
        })
    })

    describe('updatePlanFileUrl', () => {
        it('should update plan file url', async () => {
            const mockCampaign = createMockCampaign({
                planFileUrl: 'https://example.com/plan.pdf',
            })
            ;(mockPrismaClient.campaign.update as jest.Mock).mockResolvedValue(
                mockCampaign
            )

            const result = await campaignRepository.updatePlanFileUrl(
                'campaign-1',
                'https://example.com/plan.pdf'
            )

            expect(mockPrismaClient.campaign.update).toHaveBeenCalledWith({
                where: { id: 'campaign-1' },
                data: { planFileUrl: 'https://example.com/plan.pdf' },
            })
            expect(result.planFileUrl).toBe('https://example.com/plan.pdf')
        })
    })

    describe('updateBudgetFileUrl', () => {
        it('should update budget file url', async () => {
            const mockCampaign = createMockCampaign({
                budgetFileUrl: 'https://example.com/budget.xlsx',
            })
            ;(mockPrismaClient.campaign.update as jest.Mock).mockResolvedValue(
                mockCampaign
            )

            const result = await campaignRepository.updateBudgetFileUrl(
                'campaign-1',
                'https://example.com/budget.xlsx'
            )

            expect(mockPrismaClient.campaign.update).toHaveBeenCalledWith({
                where: { id: 'campaign-1' },
                data: { budgetFileUrl: 'https://example.com/budget.xlsx' },
            })
            expect(result.budgetFileUrl).toBe('https://example.com/budget.xlsx')
        })
    })

    describe('findCampaignsWithFilter', () => {
        it('should return campaigns with default pagination', async () => {
            const mockCampaigns = [
                createMockCampaign(),
                createMockCampaign({ id: 'campaign-2' }),
            ]
            ;(
                mockPrismaClient.campaign.findMany as jest.Mock
            ).mockResolvedValue(mockCampaigns)
            ;(mockPrismaClient.campaign.count as jest.Mock).mockResolvedValue(2)

            const result = await campaignRepository.findCampaignsWithFilter({})

            expect(mockPrismaClient.campaign.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null },
                skip: 0,
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    creator: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            })
            expect(result.campaigns).toHaveLength(2)
            expect(result.meta).toEqual({
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1,
            })
        })

        it('should filter by status', async () => {
            const mockCampaigns = [
                createMockCampaign({ status: 'ACTIVE' as CampaignStatus }),
            ]
            ;(
                mockPrismaClient.campaign.findMany as jest.Mock
            ).mockResolvedValue(mockCampaigns)
            ;(mockPrismaClient.campaign.count as jest.Mock).mockResolvedValue(1)

            await campaignRepository.findCampaignsWithFilter({
                status: 'ACTIVE',
            })

            expect(mockPrismaClient.campaign.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: 'ACTIVE',
                    }),
                })
            )
        })

        it('should filter by scope', async () => {
            ;(
                mockPrismaClient.campaign.findMany as jest.Mock
            ).mockResolvedValue([])
            ;(mockPrismaClient.campaign.count as jest.Mock).mockResolvedValue(0)

            await campaignRepository.findCampaignsWithFilter({ scope: 'KHOA' })

            expect(mockPrismaClient.campaign.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        scope: 'KHOA',
                    }),
                })
            )
        })

        it('should filter by creatorId', async () => {
            ;(
                mockPrismaClient.campaign.findMany as jest.Mock
            ).mockResolvedValue([])
            ;(mockPrismaClient.campaign.count as jest.Mock).mockResolvedValue(0)

            await campaignRepository.findCampaignsWithFilter({
                creatorId: 'user-1',
            })

            expect(mockPrismaClient.campaign.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        creatorId: 'user-1',
                    }),
                })
            )
        })

        it('should apply multiple filters', async () => {
            ;(
                mockPrismaClient.campaign.findMany as jest.Mock
            ).mockResolvedValue([])
            ;(mockPrismaClient.campaign.count as jest.Mock).mockResolvedValue(0)

            await campaignRepository.findCampaignsWithFilter({
                status: 'ACTIVE',
                scope: 'TRUONG',
                creatorId: 'user-1',
            })

            expect(mockPrismaClient.campaign.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        deletedAt: null,
                        status: 'ACTIVE',
                        scope: 'TRUONG',
                        creatorId: 'user-1',
                    },
                })
            )
        })

        it('should handle custom pagination', async () => {
            ;(
                mockPrismaClient.campaign.findMany as jest.Mock
            ).mockResolvedValue([])
            ;(mockPrismaClient.campaign.count as jest.Mock).mockResolvedValue(
                25
            )

            const result = await campaignRepository.findCampaignsWithFilter({
                page: 2,
                limit: 5,
            })

            expect(mockPrismaClient.campaign.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 5,
                    take: 5,
                })
            )
            expect(result.meta).toEqual({
                total: 25,
                page: 2,
                limit: 5,
                totalPages: 5,
            })
        })

        it('should return empty array when no campaigns found', async () => {
            ;(
                mockPrismaClient.campaign.findMany as jest.Mock
            ).mockResolvedValue([])
            ;(mockPrismaClient.campaign.count as jest.Mock).mockResolvedValue(0)

            const result = await campaignRepository.findCampaignsWithFilter({})

            expect(result.campaigns).toEqual([])
            expect(result.meta.total).toBe(0)
        })
    })

    describe('findAvailableCampaigns', () => {
        it('should return active campaigns for DOANTRUONG', async () => {
            const mockCampaigns = [
                createMockCampaign({ status: 'ACTIVE' as CampaignStatus }),
            ]
            ;(
                mockPrismaClient.campaign.findMany as jest.Mock
            ).mockResolvedValue(mockCampaigns)
            ;(mockPrismaClient.campaign.count as jest.Mock).mockResolvedValue(1)

            const result = await campaignRepository.findAvailableCampaigns(
                'DOANTRUONG',
                null,
                1,
                10
            )

            expect(mockPrismaClient.campaign.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        status: 'ACTIVE',
                        deletedAt: null,
                    },
                })
            )
            expect(result.campaigns).toHaveLength(1)
        })

        it('should return campaigns with OR condition for non-DOANTRUONG users', async () => {
            const mockCampaigns = [
                createMockCampaign({ status: 'ACTIVE' as CampaignStatus }),
            ]
            ;(
                mockPrismaClient.campaign.findMany as jest.Mock
            ).mockResolvedValue(mockCampaigns)
            ;(mockPrismaClient.campaign.count as jest.Mock).mockResolvedValue(1)

            await campaignRepository.findAvailableCampaigns(
                'LCD',
                '102',
                1,
                10
            )

            expect(mockPrismaClient.campaign.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        status: 'ACTIVE',
                        deletedAt: null,
                        OR: [{ scope: 'TRUONG' }, { scope: 'KHOA' }],
                    },
                })
            )
        })

        it('should include phases in result', async () => {
            const mockCampaigns = [
                createMockCampaign({
                    status: 'ACTIVE' as CampaignStatus,
                    moneyPhase: [],
                    itemPhase: [],
                    eventPhase: [],
                }),
            ]
            ;(
                mockPrismaClient.campaign.findMany as jest.Mock
            ).mockResolvedValue(mockCampaigns)
            ;(mockPrismaClient.campaign.count as jest.Mock).mockResolvedValue(1)

            const result = await campaignRepository.findAvailableCampaigns(
                'CLB',
                '102',
                1,
                10
            )

            expect(mockPrismaClient.campaign.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.objectContaining({
                        moneyPhase: true,
                        itemPhase: true,
                        eventPhase: true,
                    }),
                })
            )
        })

        it('should handle custom pagination', async () => {
            ;(
                mockPrismaClient.campaign.findMany as jest.Mock
            ).mockResolvedValue([])
            ;(mockPrismaClient.campaign.count as jest.Mock).mockResolvedValue(
                15
            )

            const result = await campaignRepository.findAvailableCampaigns(
                'LCD',
                '102',
                2,
                5
            )

            expect(mockPrismaClient.campaign.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 5,
                    take: 5,
                })
            )
            expect(result.meta).toEqual({
                total: 15,
                page: 2,
                limit: 5,
                totalPages: 3,
            })
        })

        it('should handle user without facultyId', async () => {
            ;(
                mockPrismaClient.campaign.findMany as jest.Mock
            ).mockResolvedValue([])
            ;(mockPrismaClient.campaign.count as jest.Mock).mockResolvedValue(0)

            await campaignRepository.findAvailableCampaigns('CLB', null, 1, 10)

            expect(mockPrismaClient.campaign.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        status: 'ACTIVE',
                        deletedAt: null,
                    },
                })
            )
        })
    })

    describe('softDeleteCampaign', () => {
        it('should set deletedAt timestamp', async () => {
            const deletedAt = new Date()
            const mockCampaign = createMockCampaign({ deletedAt })
            ;(mockPrismaClient.campaign.update as jest.Mock).mockResolvedValue(
                mockCampaign
            )

            const result =
                await campaignRepository.softDeleteCampaign('campaign-1')

            expect(mockPrismaClient.campaign.update).toHaveBeenCalledWith({
                where: { id: 'campaign-1' },
                data: {
                    deletedAt: expect.any(Date),
                },
            })
            expect(result.deletedAt).not.toBeNull()
        })

        it('should throw error when campaign not found', async () => {
            const prismaError = new Error('Record not found')
            ;(mockPrismaClient.campaign.update as jest.Mock).mockRejectedValue(
                prismaError
            )

            await expect(
                campaignRepository.softDeleteCampaign('non-existent')
            ).rejects.toThrow('Record not found')
        })
    })
})
