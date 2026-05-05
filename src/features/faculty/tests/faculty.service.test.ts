import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import * as facultyRepo from '../faculty.repository'
import * as facultyService from '../faculty.service'

jest.mock('../faculty.repository')

describe('Faculty Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('createFaculty', () => {
        it('should throw CONFLICT if code already exists', async () => {
            ;(facultyRepo.findByCode as jest.Mock).mockResolvedValue({ id: 1, code: 'CNTT', name: 'Existing' })

            await expect(facultyService.createFaculty({ code: 'CNTT', name: 'New Faculty' })).rejects.toThrow(ApiError)
            await expect(facultyService.createFaculty({ code: 'CNTT', name: 'New Faculty' })).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.CONFLICT
            )
        })

        it('should create faculty successfully', async () => {
            const mockFaculty = { id: 1, code: 'CNTT', name: 'Cong nghe thong tin' }
            ;(facultyRepo.findByCode as jest.Mock).mockResolvedValue(null)
            ;(facultyRepo.create as jest.Mock).mockResolvedValue(mockFaculty)

            const result = await facultyService.createFaculty({ code: 'CNTT', name: 'Cong nghe thong tin' })

            expect(facultyRepo.findByCode).toHaveBeenCalledWith('CNTT')
            expect(facultyRepo.create).toHaveBeenCalledWith({ code: 'CNTT', name: 'Cong nghe thong tin' })
            expect(result).toEqual(mockFaculty)
        })
    })

    describe('updateFaculty', () => {
        it('should throw NOT_FOUND if faculty not found', async () => {
            ;(facultyRepo.findById as jest.Mock).mockResolvedValue(null)

            await expect(facultyService.updateFaculty(1, { name: 'Updated' })).rejects.toThrow(ApiError)
            await expect(facultyService.updateFaculty(1, { name: 'Updated' })).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.NOT_FOUND
            )
        })

        it('should throw CONFLICT if new code already exists', async () => {
            ;(facultyRepo.findById as jest.Mock).mockResolvedValue({ id: 1, code: 'CNTT', name: 'Old' })
            ;(facultyRepo.findByCode as jest.Mock).mockResolvedValue({ id: 2, code: 'NEWCODE', name: 'Other' })

            await expect(facultyService.updateFaculty(1, { code: 'NEWCODE' })).rejects.toThrow(ApiError)
            await expect(facultyService.updateFaculty(1, { code: 'NEWCODE' })).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.CONFLICT
            )
        })

        it('should update faculty successfully without code change', async () => {
            const mockFaculty = { id: 1, code: 'CNTT', name: 'Updated name' }
            ;(facultyRepo.findById as jest.Mock).mockResolvedValue({ id: 1, code: 'CNTT', name: 'Old' })
            ;(facultyRepo.updateById as jest.Mock).mockResolvedValue(mockFaculty)

            const result = await facultyService.updateFaculty(1, { name: 'Updated name' })

            expect(facultyRepo.findByCode).not.toHaveBeenCalled()
            expect(facultyRepo.updateById).toHaveBeenCalledWith(1, { name: 'Updated name' })
            expect(result).toEqual(mockFaculty)
        })

        it('should update faculty successfully with same code', async () => {
            const mockFaculty = { id: 1, code: 'CNTT', name: 'Updated name' }
            ;(facultyRepo.findById as jest.Mock).mockResolvedValue({ id: 1, code: 'CNTT', name: 'Old' })
            ;(facultyRepo.updateById as jest.Mock).mockResolvedValue(mockFaculty)

            const result = await facultyService.updateFaculty(1, { code: 'CNTT', name: 'Updated name' })

            expect(facultyRepo.findByCode).not.toHaveBeenCalled()
            expect(facultyRepo.updateById).toHaveBeenCalledWith(1, { code: 'CNTT', name: 'Updated name' })
            expect(result).toEqual(mockFaculty)
        })

        it('should update faculty successfully with new unique code', async () => {
            const mockFaculty = { id: 1, code: 'NEWCODE', name: 'Updated' }
            ;(facultyRepo.findById as jest.Mock).mockResolvedValue({ id: 1, code: 'CNTT', name: 'Old' })
            ;(facultyRepo.findByCode as jest.Mock).mockResolvedValue(null)
            ;(facultyRepo.updateById as jest.Mock).mockResolvedValue(mockFaculty)

            const result = await facultyService.updateFaculty(1, { code: 'NEWCODE', name: 'Updated' })

            expect(facultyRepo.findByCode).toHaveBeenCalledWith('NEWCODE')
            expect(facultyRepo.updateById).toHaveBeenCalledWith(1, { code: 'NEWCODE', name: 'Updated' })
            expect(result).toEqual(mockFaculty)
        })
    })

    describe('deleteFaculty', () => {
        it('should throw NOT_FOUND if faculty not found', async () => {
            ;(facultyRepo.findById as jest.Mock).mockResolvedValue(null)

            await expect(facultyService.deleteFaculty(1)).rejects.toThrow(ApiError)
            await expect(facultyService.deleteFaculty(1)).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.NOT_FOUND
            )
        })

        it('should throw BAD_REQUEST if faculty has students', async () => {
            ;(facultyRepo.findById as jest.Mock).mockResolvedValue({ id: 1, code: 'CNTT', name: 'Test' })
            ;(facultyRepo.findStatsById as jest.Mock).mockResolvedValue({
                totalStudents: 10,
                totalUsers: 0,
                totalClubs: 0,
                totalPoints: 0,
            })

            await expect(facultyService.deleteFaculty(1)).rejects.toThrow(ApiError)
            await expect(facultyService.deleteFaculty(1)).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.BAD_REQUEST
            )
        })

        it('should throw BAD_REQUEST if faculty has users', async () => {
            ;(facultyRepo.findById as jest.Mock).mockResolvedValue({ id: 1, code: 'CNTT', name: 'Test' })
            ;(facultyRepo.findStatsById as jest.Mock).mockResolvedValue({
                totalStudents: 0,
                totalUsers: 5,
                totalClubs: 0,
                totalPoints: 0,
            })

            await expect(facultyService.deleteFaculty(1)).rejects.toThrow(ApiError)
            await expect(facultyService.deleteFaculty(1)).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.BAD_REQUEST
            )
        })

        it('should delete faculty successfully when no students or users', async () => {
            ;(facultyRepo.findById as jest.Mock).mockResolvedValue({ id: 1, code: 'CNTT', name: 'Test' })
            ;(facultyRepo.findStatsById as jest.Mock).mockResolvedValue({
                totalStudents: 0,
                totalUsers: 0,
                totalClubs: 0,
                totalPoints: 0,
            })
            ;(facultyRepo.deleteById as jest.Mock).mockResolvedValue({ id: 1 })

            await facultyService.deleteFaculty(1)

            expect(facultyRepo.deleteById).toHaveBeenCalledWith(1)
        })
    })

    describe('getAllFaculties', () => {
        it('should return paginated faculties', async () => {
            const mockResult = {
                items: [
                    { id: 1, code: 'CNTT', name: 'Cong nghe thong tin' },
                    { id: 2, code: 'DT', name: 'Dien tu' },
                ],
                meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
            }
            ;(facultyRepo.findMany as jest.Mock).mockResolvedValue(mockResult)

            const result = await facultyService.getAllFaculties({ page: 1, limit: 20 })

            expect(facultyRepo.findMany).toHaveBeenCalledWith({ page: 1, limit: 20 })
            expect(result).toEqual(mockResult)
        })

        it('should pass search parameter to repository', async () => {
            const mockResult = {
                items: [{ id: 1, code: 'CNTT', name: 'Cong nghe thong tin' }],
                meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
            }
            ;(facultyRepo.findMany as jest.Mock).mockResolvedValue(mockResult)

            const result = await facultyService.getAllFaculties({ page: 1, limit: 20, search: 'CNTT' })

            expect(facultyRepo.findMany).toHaveBeenCalledWith({ page: 1, limit: 20, search: 'CNTT' })
            expect(result).toEqual(mockResult)
        })
    })

    describe('getFacultyById', () => {
        it('should throw NOT_FOUND if faculty not found', async () => {
            ;(facultyRepo.findById as jest.Mock).mockResolvedValue(null)

            await expect(facultyService.getFacultyById(1)).rejects.toThrow(ApiError)
            await expect(facultyService.getFacultyById(1)).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.NOT_FOUND
            )
        })

        it('should return faculty by id', async () => {
            const mockFaculty = { id: 1, code: 'CNTT', name: 'Cong nghe thong tin' }
            ;(facultyRepo.findById as jest.Mock).mockResolvedValue(mockFaculty)

            const result = await facultyService.getFacultyById(1)

            expect(facultyRepo.findById).toHaveBeenCalledWith(1)
            expect(result).toEqual(mockFaculty)
        })
    })

    describe('getFacultyByCode', () => {
        it('should throw NOT_FOUND if faculty not found', async () => {
            ;(facultyRepo.findByCode as jest.Mock).mockResolvedValue(null)

            await expect(facultyService.getFacultyByCode('NONEXISTENT')).rejects.toThrow(ApiError)
            await expect(facultyService.getFacultyByCode('NONEXISTENT')).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.NOT_FOUND
            )
        })

        it('should return faculty by code', async () => {
            const mockFaculty = { id: 1, code: 'CNTT', name: 'Cong nghe thong tin' }
            ;(facultyRepo.findByCode as jest.Mock).mockResolvedValue(mockFaculty)

            const result = await facultyService.getFacultyByCode('CNTT')

            expect(facultyRepo.findByCode).toHaveBeenCalledWith('CNTT')
            expect(result).toEqual(mockFaculty)
        })
    })

    describe('getFacultyStats', () => {
        it('should throw NOT_FOUND if faculty not found', async () => {
            ;(facultyRepo.findById as jest.Mock).mockResolvedValue(null)

            await expect(facultyService.getFacultyStats(1)).rejects.toThrow(ApiError)
            await expect(facultyService.getFacultyStats(1)).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.NOT_FOUND
            )
        })

        it('should return faculty stats', async () => {
            const mockFaculty = { id: 1, code: 'CNTT', name: 'Cong nghe thong tin' }
            const mockStats = { totalStudents: 100, totalUsers: 50, totalClubs: 5, totalPoints: 1000 }
            ;(facultyRepo.findById as jest.Mock).mockResolvedValue(mockFaculty)
            ;(facultyRepo.findStatsById as jest.Mock).mockResolvedValue(mockStats)

            const result = await facultyService.getFacultyStats(1)

            expect(facultyRepo.findById).toHaveBeenCalledWith(1)
            expect(facultyRepo.findStatsById).toHaveBeenCalledWith(1)
            expect(result).toEqual({ faculty: mockFaculty, stats: mockStats })
        })
    })

    describe('getFacultiesList', () => {
        it('should return all faculties', async () => {
            const mockFaculties = [
                { id: 1, code: 'CNTT', name: 'Cong nghe thong tin' },
                { id: 2, code: 'DT', name: 'Dien tu' },
            ]
            ;(facultyRepo.findAll as jest.Mock).mockResolvedValue(mockFaculties)

            const result = await facultyService.getFacultiesList()

            expect(facultyRepo.findAll).toHaveBeenCalled()
            expect(result).toEqual(mockFaculties)
        })
    })
})