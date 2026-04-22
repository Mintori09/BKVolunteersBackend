import * as titleRepository from '../title.repository'
import { prismaClient } from 'src/config'

jest.mock('src/config', () => ({
    prismaClient: {
        title: {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
    },
}))

const mockPrismaClient = prismaClient as jest.Mocked<typeof prismaClient>

describe('Title Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('create', () => {
        it('should create a title with all fields', async () => {
            const input = {
                name: 'Gold Member',
                description: 'Gold level membership',
                minPoints: 100,
                iconUrl: 'https://example.com/gold.png',
                badgeColor: '#FFD700',
            }
            const mockTitle = {
                id: 1,
                ...input,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            ;(mockPrismaClient.title.create as jest.Mock).mockResolvedValue(
                mockTitle
            )

            const result = await titleRepository.create(input)

            expect(mockPrismaClient.title.create).toHaveBeenCalledWith({
                data: {
                    name: input.name,
                    description: input.description,
                    minPoints: input.minPoints,
                    iconUrl: input.iconUrl,
                    badgeColor: input.badgeColor,
                },
            })
            expect(result).toEqual(mockTitle)
        })

        it('should create a title with required fields only', async () => {
            const input = {
                name: 'Bronze Member',
                minPoints: 10,
            }
            const mockTitle = {
                id: 2,
                name: input.name,
                description: null,
                minPoints: input.minPoints,
                iconUrl: null,
                badgeColor: null,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            ;(mockPrismaClient.title.create as jest.Mock).mockResolvedValue(
                mockTitle
            )

            const result = await titleRepository.create(input)

            expect(mockPrismaClient.title.create).toHaveBeenCalledWith({
                data: {
                    name: input.name,
                    minPoints: input.minPoints,
                },
            })
            expect(result).toEqual(mockTitle)
        })

        it('should throw error when database fails', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.title.create as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                titleRepository.create({ name: 'Test', minPoints: 50 })
            ).rejects.toThrow('Database error')
        })
    })

    describe('updateById', () => {
        it('should update a title by id', async () => {
            const updateData = {
                name: 'Updated Title',
                description: 'Updated description',
            }
            const mockTitle = {
                id: 1,
                name: 'Updated Title',
                description: 'Updated description',
                minPoints: 100,
                iconUrl: null,
                badgeColor: null,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            ;(mockPrismaClient.title.update as jest.Mock).mockResolvedValue(
                mockTitle
            )

            const result = await titleRepository.updateById(1, updateData)

            expect(mockPrismaClient.title.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: updateData,
            })
            expect(result).toEqual(mockTitle)
        })

        it('should update isActive field', async () => {
            const updateData = { isActive: false }
            const mockTitle = {
                id: 1,
                name: 'Test',
                description: null,
                minPoints: 100,
                iconUrl: null,
                badgeColor: null,
                isActive: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            ;(mockPrismaClient.title.update as jest.Mock).mockResolvedValue(
                mockTitle
            )

            const result = await titleRepository.updateById(1, updateData)

            expect(mockPrismaClient.title.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: updateData,
            })
            expect(result.isActive).toBe(false)
        })

        it('should throw error when title not found', async () => {
            const prismaError = new Error('Record not found')
            ;(mockPrismaClient.title.update as jest.Mock).mockRejectedValue(
                prismaError
            )

            await expect(
                titleRepository.updateById(999, { name: 'Test' })
            ).rejects.toThrow('Record not found')
        })
    })

    describe('deleteById', () => {
        it('should delete a title by id', async () => {
            const mockTitle = {
                id: 1,
                name: 'Deleted Title',
                description: null,
                minPoints: 100,
                iconUrl: null,
                badgeColor: null,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            ;(mockPrismaClient.title.delete as jest.Mock).mockResolvedValue(
                mockTitle
            )

            const result = await titleRepository.deleteById(1)

            expect(mockPrismaClient.title.delete).toHaveBeenCalledWith({
                where: { id: 1 },
            })
            expect(result).toEqual(mockTitle)
        })

        it('should throw error when title not found', async () => {
            const prismaError = new Error('Record not found')
            ;(mockPrismaClient.title.delete as jest.Mock).mockRejectedValue(
                prismaError
            )

            await expect(titleRepository.deleteById(999)).rejects.toThrow(
                'Record not found'
            )
        })
    })

    describe('findById', () => {
        it('should return title when found', async () => {
            const mockTitle = {
                id: 1,
                name: 'Gold Member',
                description: 'Gold level',
                minPoints: 100,
                iconUrl: 'https://example.com/gold.png',
                badgeColor: '#FFD700',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            ;(mockPrismaClient.title.findUnique as jest.Mock).mockResolvedValue(
                mockTitle
            )

            const result = await titleRepository.findById(1)

            expect(mockPrismaClient.title.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
            })
            expect(result).toEqual(mockTitle)
        })

        it('should return null when title not found', async () => {
            ;(mockPrismaClient.title.findUnique as jest.Mock).mockResolvedValue(
                null
            )

            const result = await titleRepository.findById(999)

            expect(mockPrismaClient.title.findUnique).toHaveBeenCalledWith({
                where: { id: 999 },
            })
            expect(result).toBeNull()
        })

        it('should throw error when database fails', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.title.findUnique as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(titleRepository.findById(1)).rejects.toThrow(
                'Database error'
            )
        })
    })

    describe('findMany', () => {
        it('should return paginated titles without filters', async () => {
            const mockTitles = [
                {
                    id: 1,
                    name: 'Bronze',
                    minPoints: 10,
                    isActive: true,
                },
                {
                    id: 2,
                    name: 'Silver',
                    minPoints: 50,
                    isActive: true,
                },
            ]
            ;(mockPrismaClient.title.findMany as jest.Mock).mockResolvedValue(
                mockTitles
            )
            ;(mockPrismaClient.title.count as jest.Mock).mockResolvedValue(2)

            const result = await titleRepository.findMany({})

            expect(mockPrismaClient.title.findMany).toHaveBeenCalledWith({
                where: {},
                orderBy: { minPoints: 'asc' },
                skip: 0,
                take: 10,
            })
            expect(mockPrismaClient.title.count).toHaveBeenCalledWith({
                where: {},
            })
            expect(result).toEqual({
                items: mockTitles,
                meta: {
                    total: 2,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                },
            })
        })

        it('should return paginated titles with isActive filter', async () => {
            const mockTitles = [
                {
                    id: 1,
                    name: 'Bronze',
                    minPoints: 10,
                    isActive: true,
                },
            ]
            ;(mockPrismaClient.title.findMany as jest.Mock).mockResolvedValue(
                mockTitles
            )
            ;(mockPrismaClient.title.count as jest.Mock).mockResolvedValue(1)

            const result = await titleRepository.findMany({ isActive: true })

            expect(mockPrismaClient.title.findMany).toHaveBeenCalledWith({
                where: { isActive: true },
                orderBy: { minPoints: 'asc' },
                skip: 0,
                take: 10,
            })
            expect(mockPrismaClient.title.count).toHaveBeenCalledWith({
                where: { isActive: true },
            })
            expect(result.items).toHaveLength(1)
        })

        it('should return paginated titles with isActive false filter', async () => {
            const mockTitles = [
                {
                    id: 3,
                    name: 'Inactive',
                    minPoints: 0,
                    isActive: false,
                },
            ]
            ;(mockPrismaClient.title.findMany as jest.Mock).mockResolvedValue(
                mockTitles
            )
            ;(mockPrismaClient.title.count as jest.Mock).mockResolvedValue(1)

            const result = await titleRepository.findMany({ isActive: false })

            expect(mockPrismaClient.title.findMany).toHaveBeenCalledWith({
                where: { isActive: false },
                orderBy: { minPoints: 'asc' },
                skip: 0,
                take: 10,
            })
            expect(result.items).toHaveLength(1)
        })

        it('should return paginated titles with custom page and limit', async () => {
            const mockTitles = [
                {
                    id: 3,
                    name: 'Gold',
                    minPoints: 100,
                    isActive: true,
                },
            ]
            ;(mockPrismaClient.title.findMany as jest.Mock).mockResolvedValue(
                mockTitles
            )
            ;(mockPrismaClient.title.count as jest.Mock).mockResolvedValue(25)

            const result = await titleRepository.findMany({
                page: 2,
                limit: 5,
            })

            expect(mockPrismaClient.title.findMany).toHaveBeenCalledWith({
                where: {},
                orderBy: { minPoints: 'asc' },
                skip: 5,
                take: 5,
            })
            expect(result.meta.page).toBe(2)
            expect(result.meta.limit).toBe(5)
            expect(result.meta.total).toBe(25)
            expect(result.meta.totalPages).toBe(5)
        })

        it('should calculate totalPages correctly', async () => {
            ;(mockPrismaClient.title.findMany as jest.Mock).mockResolvedValue([])
            ;(mockPrismaClient.title.count as jest.Mock).mockResolvedValue(23)

            const result = await titleRepository.findMany({ limit: 10 })

            expect(result.meta.totalPages).toBe(3)
        })

        it('should handle empty results', async () => {
            ;(mockPrismaClient.title.findMany as jest.Mock).mockResolvedValue([])
            ;(mockPrismaClient.title.count as jest.Mock).mockResolvedValue(0)

            const result = await titleRepository.findMany({})

            expect(result.items).toHaveLength(0)
            expect(result.meta.total).toBe(0)
            expect(result.meta.totalPages).toBe(0)
        })

        it('should throw error when database fails', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.title.findMany as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(titleRepository.findMany({})).rejects.toThrow(
                'Database error'
            )
        })
    })

    describe('findTitlesBelowPoints', () => {
        it('should return active titles with minPoints less than or equal to given points', async () => {
            const mockTitles = [
                {
                    id: 1,
                    name: 'Bronze',
                    minPoints: 10,
                    isActive: true,
                },
                {
                    id: 2,
                    name: 'Silver',
                    minPoints: 50,
                    isActive: true,
                },
            ]
            ;(mockPrismaClient.title.findMany as jest.Mock).mockResolvedValue(
                mockTitles
            )

            const result = await titleRepository.findTitlesBelowPoints(100)

            expect(mockPrismaClient.title.findMany).toHaveBeenCalledWith({
                where: {
                    minPoints: { lte: 100 },
                    isActive: true,
                },
                orderBy: { minPoints: 'asc' },
            })
            expect(result).toEqual(mockTitles)
        })

        it('should return empty array when no titles match', async () => {
            ;(mockPrismaClient.title.findMany as jest.Mock).mockResolvedValue([])

            const result = await titleRepository.findTitlesBelowPoints(5)

            expect(mockPrismaClient.title.findMany).toHaveBeenCalledWith({
                where: {
                    minPoints: { lte: 5 },
                    isActive: true,
                },
                orderBy: { minPoints: 'asc' },
            })
            expect(result).toHaveLength(0)
        })

        it('should only return active titles', async () => {
            const mockTitles = [
                {
                    id: 1,
                    name: 'Active Title',
                    minPoints: 10,
                    isActive: true,
                },
            ]
            ;(mockPrismaClient.title.findMany as jest.Mock).mockResolvedValue(
                mockTitles
            )

            await titleRepository.findTitlesBelowPoints(100)

            expect(mockPrismaClient.title.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        isActive: true,
                    }),
                })
            )
        })

        it('should order results by minPoints ascending', async () => {
            const mockTitles = [
                { id: 1, name: 'Bronze', minPoints: 10, isActive: true },
                { id: 2, name: 'Silver', minPoints: 50, isActive: true },
            ]
            ;(mockPrismaClient.title.findMany as jest.Mock).mockResolvedValue(
                mockTitles
            )

            await titleRepository.findTitlesBelowPoints(100)

            expect(mockPrismaClient.title.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { minPoints: 'asc' },
                })
            )
        })

        it('should throw error when database fails', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.title.findMany as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                titleRepository.findTitlesBelowPoints(100)
            ).rejects.toThrow('Database error')
        })
    })
})