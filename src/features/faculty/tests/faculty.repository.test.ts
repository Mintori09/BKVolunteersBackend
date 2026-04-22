jest.mock('src/config', () => ({
    prismaClient: {
        faculty: {
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
        student: {
            aggregate: jest.fn(),
        },
        user: {
            count: jest.fn(),
        },
        club: {
            count: jest.fn(),
        },
    },
}))

import { prismaClient } from 'src/config'
import * as facultyRepo from '../faculty.repository'

describe('Faculty Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('create', () => {
        it('should create a faculty', async () => {
            const mockFaculty = { id: 1, code: 'CNTT', name: 'Cong nghe thong tin' }
            ;(prismaClient.faculty.create as jest.Mock).mockResolvedValue(mockFaculty)

            const result = await facultyRepo.create({ code: 'CNTT', name: 'Cong nghe thong tin' })

            expect(prismaClient.faculty.create).toHaveBeenCalledWith({
                data: { code: 'CNTT', name: 'Cong nghe thong tin' },
            })
            expect(result).toEqual(mockFaculty)
        })
    })

    describe('updateById', () => {
        it('should update a faculty by id', async () => {
            const mockFaculty = { id: 1, code: 'CNTT', name: 'Updated name' }
            ;(prismaClient.faculty.update as jest.Mock).mockResolvedValue(mockFaculty)

            const result = await facultyRepo.updateById(1, { name: 'Updated name' })

            expect(prismaClient.faculty.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { name: 'Updated name' },
            })
            expect(result).toEqual(mockFaculty)
        })
    })

    describe('deleteById', () => {
        it('should delete a faculty by id', async () => {
            const mockFaculty = { id: 1, code: 'CNTT', name: 'Deleted' }
            ;(prismaClient.faculty.delete as jest.Mock).mockResolvedValue(mockFaculty)

            const result = await facultyRepo.deleteById(1)

            expect(prismaClient.faculty.delete).toHaveBeenCalledWith({ where: { id: 1 } })
            expect(result).toEqual(mockFaculty)
        })
    })

    describe('findById', () => {
        it('should find faculty by id', async () => {
            const mockFaculty = { id: 1, code: 'CNTT', name: 'Cong nghe thong tin' }
            ;(prismaClient.faculty.findUnique as jest.Mock).mockResolvedValue(mockFaculty)

            const result = await facultyRepo.findById(1)

            expect(prismaClient.faculty.findUnique).toHaveBeenCalledWith({ where: { id: 1 } })
            expect(result).toEqual(mockFaculty)
        })

        it('should return null when faculty not found', async () => {
            ;(prismaClient.faculty.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await facultyRepo.findById(999)

            expect(result).toBeNull()
        })
    })

    describe('findByCode', () => {
        it('should find faculty by code', async () => {
            const mockFaculty = { id: 1, code: 'CNTT', name: 'Cong nghe thong tin' }
            ;(prismaClient.faculty.findUnique as jest.Mock).mockResolvedValue(mockFaculty)

            const result = await facultyRepo.findByCode('CNTT')

            expect(prismaClient.faculty.findUnique).toHaveBeenCalledWith({ where: { code: 'CNTT' } })
            expect(result).toEqual(mockFaculty)
        })

        it('should return null when faculty not found', async () => {
            ;(prismaClient.faculty.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await facultyRepo.findByCode('NONEXISTENT')

            expect(result).toBeNull()
        })
    })

    describe('findMany', () => {
        it('should return paginated faculties with no filters', async () => {
            const mockFaculties = [
                { id: 1, code: 'CNTT', name: 'Cong nghe thong tin' },
                { id: 2, code: 'DT', name: 'Dien tu' },
            ]
            ;(prismaClient.faculty.findMany as jest.Mock).mockResolvedValue(mockFaculties)
            ;(prismaClient.faculty.count as jest.Mock).mockResolvedValue(2)

            const result = await facultyRepo.findMany({ page: 1, limit: 20 })

            expect(result.items).toEqual(mockFaculties)
            expect(result.meta).toEqual({ total: 2, page: 1, limit: 20, totalPages: 1 })
            expect(prismaClient.faculty.findMany).toHaveBeenCalledWith({
                where: {},
                orderBy: { code: 'asc' },
                skip: 0,
                take: 20,
            })
        })

        it('should filter by search term', async () => {
            const mockFaculties = [{ id: 1, code: 'CNTT', name: 'Cong nghe thong tin' }]
            ;(prismaClient.faculty.findMany as jest.Mock).mockResolvedValue(mockFaculties)
            ;(prismaClient.faculty.count as jest.Mock).mockResolvedValue(1)

            const result = await facultyRepo.findMany({ page: 1, limit: 20, search: 'CNTT' })

            expect(result.items).toEqual(mockFaculties)
            expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 })
            expect(prismaClient.faculty.findMany).toHaveBeenCalledWith({
                where: { OR: [{ code: { contains: 'CNTT' } }, { name: { contains: 'CNTT' } }] },
                orderBy: { code: 'asc' },
                skip: 0,
                take: 20,
            })
        })

        it('should use default pagination values', async () => {
            ;(prismaClient.faculty.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.faculty.count as jest.Mock).mockResolvedValue(0)

            const result = await facultyRepo.findMany({})

            expect(result.meta).toEqual({ total: 0, page: 1, limit: 20, totalPages: 0 })
            expect(prismaClient.faculty.findMany).toHaveBeenCalledWith({
                where: {},
                orderBy: { code: 'asc' },
                skip: 0,
                take: 20,
            })
        })

        it('should calculate correct offset for pagination', async () => {
            ;(prismaClient.faculty.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.faculty.count as jest.Mock).mockResolvedValue(100)

            await facultyRepo.findMany({ page: 3, limit: 10 })

            expect(prismaClient.faculty.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 20,
                    take: 10,
                })
            )
        })

        it('should calculate correct totalPages', async () => {
            ;(prismaClient.faculty.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.faculty.count as jest.Mock).mockResolvedValue(25)

            const result = await facultyRepo.findMany({ page: 1, limit: 10 })

            expect(result.meta.totalPages).toBe(3)
        })
    })

    describe('findStatsById', () => {
        it('should return zero stats when faculty not found', async () => {
            ;(prismaClient.faculty.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await facultyRepo.findStatsById(999)

            expect(result).toEqual({
                totalStudents: 0,
                totalUsers: 0,
                totalClubs: 0,
                totalPoints: 0,
            })
        })

        it('should return stats for faculty', async () => {
            ;(prismaClient.faculty.findUnique as jest.Mock).mockResolvedValue({ code: 'CNTT' })
            ;(prismaClient.student.aggregate as jest.Mock).mockResolvedValue({
                _count: 100,
                _sum: { totalPoints: 5000 },
            })
            ;(prismaClient.user.count as jest.Mock).mockResolvedValue(50)
            ;(prismaClient.club.count as jest.Mock).mockResolvedValue(5)

            const result = await facultyRepo.findStatsById(1)

            expect(result).toEqual({
                totalStudents: 100,
                totalUsers: 50,
                totalClubs: 5,
                totalPoints: 5000,
            })
            expect(prismaClient.student.aggregate).toHaveBeenCalledWith({
                where: { facultyId: 'CNTT' },
                _count: true,
                _sum: { totalPoints: true },
            })
            expect(prismaClient.user.count).toHaveBeenCalledWith({ where: { facultyId: 1 } })
            expect(prismaClient.club.count).toHaveBeenCalledWith({ where: { facultyId: 1 } })
        })

        it('should return zero totalPoints when sum is null', async () => {
            ;(prismaClient.faculty.findUnique as jest.Mock).mockResolvedValue({ code: 'CNTT' })
            ;(prismaClient.student.aggregate as jest.Mock).mockResolvedValue({
                _count: 0,
                _sum: { totalPoints: null },
            })
            ;(prismaClient.user.count as jest.Mock).mockResolvedValue(0)
            ;(prismaClient.club.count as jest.Mock).mockResolvedValue(0)

            const result = await facultyRepo.findStatsById(1)

            expect(result.totalPoints).toBe(0)
        })
    })

    describe('findAll', () => {
        it('should return all faculties ordered by code', async () => {
            const mockFaculties = [
                { id: 2, code: 'DT', name: 'Dien tu' },
                { id: 1, code: 'CNTT', name: 'Cong nghe thong tin' },
            ]
            ;(prismaClient.faculty.findMany as jest.Mock).mockResolvedValue(mockFaculties)

            const result = await facultyRepo.findAll()

            expect(prismaClient.faculty.findMany).toHaveBeenCalledWith({
                orderBy: { code: 'asc' },
            })
            expect(result).toEqual(mockFaculties)
        })

        it('should return empty array when no faculties', async () => {
            ;(prismaClient.faculty.findMany as jest.Mock).mockResolvedValue([])

            const result = await facultyRepo.findAll()

            expect(result).toEqual([])
        })
    })
})