import * as clubRepo from '../club.repository'

jest.mock('src/config', () => ({
    prismaClient: {
        club: {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
    },
}))

describe('Club Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('create', () => {
        it('should create club with faculty and leader', async () => {
            const mockClub = {
                id: 'club-1',
                name: 'Test Club',
                facultyId: 1,
                leaderId: 'user-1',
                faculty: { id: 1, name: 'Test Faculty' },
                leader: { id: 'user-1', username: 'leader', email: 'leader@test.com' },
            }
            const { prismaClient } = require('src/config')
            ;(prismaClient.club.create as jest.Mock).mockResolvedValue(mockClub)

            const result = await clubRepo.create({
                name: 'Test Club',
                facultyId: 1,
                leaderId: 'user-1',
            })

            expect(result).toEqual(mockClub)
            expect(prismaClient.club.create).toHaveBeenCalledWith({
                data: {
                    name: 'Test Club',
                    facultyId: 1,
                    leaderId: 'user-1',
                },
                include: {
                    faculty: true,
                    leader: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                },
            })
        })
    })

    describe('updateById', () => {
        it('should update club by id', async () => {
            const mockClub = {
                id: 'club-1',
                name: 'Updated Club',
                faculty: { id: 'faculty-1', name: 'Test Faculty' },
                leader: { id: 'user-1', username: 'leader', email: 'leader@test.com' },
            }
            const { prismaClient } = require('src/config')
            ;(prismaClient.club.update as jest.Mock).mockResolvedValue(mockClub)

            const result = await clubRepo.updateById('club-1', { name: 'Updated Club' })

            expect(result).toEqual(mockClub)
            expect(prismaClient.club.update).toHaveBeenCalledWith({
                where: { id: 'club-1' },
                data: { name: 'Updated Club' },
                include: {
                    faculty: true,
                    leader: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                },
            })
        })

        it('should update club leader', async () => {
            const mockClub = {
                id: 'club-1',
                leaderId: 'user-2',
                faculty: {},
                leader: { id: 'user-2', username: 'new-leader', email: 'new@test.com' },
            }
            const { prismaClient } = require('src/config')
            ;(prismaClient.club.update as jest.Mock).mockResolvedValue(mockClub)

            const result = await clubRepo.updateById('club-1', { leaderId: 'user-2' })

            expect(result.leaderId).toBe('user-2')
        })
    })

    describe('deleteById', () => {
        it('should delete club by id', async () => {
            const mockClub = { id: 'club-1', name: 'Deleted Club' }
            const { prismaClient } = require('src/config')
            ;(prismaClient.club.delete as jest.Mock).mockResolvedValue(mockClub)

            const result = await clubRepo.deleteById('club-1')

            expect(result).toEqual(mockClub)
            expect(prismaClient.club.delete).toHaveBeenCalledWith({
                where: { id: 'club-1' },
            })
        })
    })

    describe('findById', () => {
        it('should find club by id', async () => {
            const mockClub = {
                id: 'club-1',
                name: 'Test Club',
                faculty: { id: 'faculty-1', name: 'Test Faculty' },
                leader: { id: 'user-1', username: 'leader', email: 'leader@test.com' },
            }
            const { prismaClient } = require('src/config')
            ;(prismaClient.club.findUnique as jest.Mock).mockResolvedValue(mockClub)

            const result = await clubRepo.findById('club-1')

            expect(result).toEqual(mockClub)
            expect(prismaClient.club.findUnique).toHaveBeenCalledWith({
                where: { id: 'club-1' },
                include: {
                    faculty: true,
                    leader: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                },
            })
        })

        it('should return null if club not found', async () => {
            const { prismaClient } = require('src/config')
            ;(prismaClient.club.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await clubRepo.findById('nonexistent')

            expect(result).toBeNull()
        })
    })

    describe('findMany', () => {
        it('should return paginated clubs without filters', async () => {
            const mockClubs = [
                { id: 'club-1', name: 'Club A', faculty: {}, leader: {} },
                { id: 'club-2', name: 'Club B', faculty: {}, leader: {} },
            ]
            const { prismaClient } = require('src/config')
            ;(prismaClient.club.findMany as jest.Mock).mockResolvedValue(mockClubs)
            ;(prismaClient.club.count as jest.Mock).mockResolvedValue(2)

            const result = await clubRepo.findMany({})

            expect(result.items).toEqual(mockClubs)
            expect(result.meta).toEqual({ total: 2, page: 1, limit: 20, totalPages: 1 })
            expect(prismaClient.club.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null },
                orderBy: { name: 'asc' },
                skip: 0,
                take: 20,
                include: {
                    faculty: true,
                    leader: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                },
            })
        })

        it('should filter by facultyId', async () => {
            const mockClubs = [{ id: 'club-1', name: 'Club A', facultyId: 1 }]
            const { prismaClient } = require('src/config')
            ;(prismaClient.club.findMany as jest.Mock).mockResolvedValue(mockClubs)
            ;(prismaClient.club.count as jest.Mock).mockResolvedValue(1)

            await clubRepo.findMany({ facultyId: 1 })

            expect(prismaClient.club.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null, facultyId: 1 },
                orderBy: { name: 'asc' },
                skip: 0,
                take: 20,
                include: expect.any(Object),
            })
        })

        it('should filter by search term', async () => {
            const mockClubs = [{ id: 'club-1', name: 'Test Club' }]
            const { prismaClient } = require('src/config')
            ;(prismaClient.club.findMany as jest.Mock).mockResolvedValue(mockClubs)
            ;(prismaClient.club.count as jest.Mock).mockResolvedValue(1)

            await clubRepo.findMany({ search: 'Test' })

            expect(prismaClient.club.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null, name: { contains: 'Test' } },
                orderBy: { name: 'asc' },
                skip: 0,
                take: 20,
                include: expect.any(Object),
            })
        })

        it('should apply pagination correctly', async () => {
            const { prismaClient } = require('src/config')
            ;(prismaClient.club.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.club.count as jest.Mock).mockResolvedValue(50)

            const result = await clubRepo.findMany({ page: 2, limit: 10 })

            expect(result.meta).toEqual({ total: 50, page: 2, limit: 10, totalPages: 5 })
            expect(prismaClient.club.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null },
                orderBy: { name: 'asc' },
                skip: 10,
                take: 10,
                include: expect.any(Object),
            })
        })

        it('should combine all filters', async () => {
            const { prismaClient } = require('src/config')
            ;(prismaClient.club.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.club.count as jest.Mock).mockResolvedValue(0)

            await clubRepo.findMany({ facultyId: 1, search: 'Test', page: 1, limit: 5 })

            expect(prismaClient.club.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null, facultyId: 1, name: { contains: 'Test' } },
                orderBy: { name: 'asc' },
                skip: 0,
                take: 5,
                include: expect.any(Object),
            })
        })

        it('should use default values for pagination', async () => {
            const { prismaClient } = require('src/config')
            ;(prismaClient.club.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.club.count as jest.Mock).mockResolvedValue(0)

            await clubRepo.findMany({})

            expect(prismaClient.club.findMany).toHaveBeenCalledWith({
                where: { deletedAt: null },
                orderBy: { name: 'asc' },
                skip: 0,
                take: 20,
                include: expect.any(Object),
            })
        })
    })

    describe('softDeleteById', () => {
        it('should soft delete club by setting deletedAt', async () => {
            const mockClub = { id: 'club-1', name: 'Deleted Club', deletedAt: new Date() }
            const { prismaClient } = require('src/config')
            ;(prismaClient.club.update as jest.Mock).mockResolvedValue(mockClub)

            const result = await clubRepo.softDeleteById('club-1')

            expect(result).toEqual(mockClub)
            expect(prismaClient.club.update).toHaveBeenCalledWith({
                where: { id: 'club-1' },
                data: { deletedAt: expect.any(Date) },
            })
        })
    })
})