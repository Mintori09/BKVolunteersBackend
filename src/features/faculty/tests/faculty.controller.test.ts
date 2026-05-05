import { Response, NextFunction } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiResponse } from 'src/utils/ApiResponse'
import * as facultyService from '../faculty.service'
import * as facultyController from '../faculty.controller'

jest.mock('../faculty.service')
jest.mock('src/utils/ApiResponse')

describe('Faculty Controller', () => {
    let req: any
    let res: any
    let next: NextFunction

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            query: {},
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('createFaculty', () => {
        it('should create faculty successfully', async () => {
            req.body = { code: 'CNTT', name: 'Cong nghe thong tin' }
            const mockFaculty = { id: 1, code: 'CNTT', name: 'Cong nghe thong tin' }
            ;(facultyService.createFaculty as jest.Mock).mockResolvedValue(mockFaculty)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await facultyController.createFaculty(req, res, next)

            expect(facultyService.createFaculty).toHaveBeenCalledWith(req.body)
            expect(ApiResponse.success).toHaveBeenCalledWith(
                res,
                mockFaculty,
                'Tạo khoa thành công',
                HttpStatus.CREATED
            )
        })

        it('should call next with error when service throws', async () => {
            req.body = { code: 'CNTT', name: 'Cong nghe thong tin' }
            const error = new Error('Service error')
            ;(facultyService.createFaculty as jest.Mock).mockRejectedValue(error)

            await facultyController.createFaculty(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe('updateFaculty', () => {
        it('should update faculty successfully', async () => {
            req.params = { id: '1' }
            req.body = { name: 'Updated name' }
            const mockFaculty = { id: 1, code: 'CNTT', name: 'Updated name' }
            ;(facultyService.updateFaculty as jest.Mock).mockResolvedValue(mockFaculty)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await facultyController.updateFaculty(req, res, next)

            expect(facultyService.updateFaculty).toHaveBeenCalledWith(1, req.body)
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockFaculty, 'Cập nhật khoa thành công')
        })

        it('should call next with error when service throws', async () => {
            req.params = { id: '1' }
            req.body = { name: 'Updated name' }
            const error = new Error('Service error')
            ;(facultyService.updateFaculty as jest.Mock).mockRejectedValue(error)

            await facultyController.updateFaculty(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe('deleteFaculty', () => {
        it('should delete faculty successfully', async () => {
            req.params = { id: '1' }
            ;(facultyService.deleteFaculty as jest.Mock).mockResolvedValue(undefined)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await facultyController.deleteFaculty(req, res, next)

            expect(facultyService.deleteFaculty).toHaveBeenCalledWith(1)
            expect(ApiResponse.success).toHaveBeenCalledWith(res, null, 'Xóa khoa thành công')
        })

        it('should call next with error when service throws', async () => {
            req.params = { id: '1' }
            const error = new Error('Service error')
            ;(facultyService.deleteFaculty as jest.Mock).mockRejectedValue(error)

            await facultyController.deleteFaculty(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe('getAllFaculties', () => {
        it('should get all faculties with default pagination', async () => {
            req.query = {}
            const mockResult = {
                items: [],
                meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
            }
            ;(facultyService.getAllFaculties as jest.Mock).mockResolvedValue(mockResult)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await facultyController.getAllFaculties(req, res, next)

            expect(facultyService.getAllFaculties).toHaveBeenCalledWith({
                page: undefined,
                limit: undefined,
                search: undefined,
            })
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockResult)
        })

        it('should get all faculties with custom pagination and search', async () => {
            req.query = { page: '2', limit: '10', search: 'CNTT' }
            const mockResult = {
                items: [{ id: 1, code: 'CNTT', name: 'Cong nghe thong tin' }],
                meta: { total: 1, page: 2, limit: 10, totalPages: 1 },
            }
            ;(facultyService.getAllFaculties as jest.Mock).mockResolvedValue(mockResult)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await facultyController.getAllFaculties(req, res, next)

            expect(facultyService.getAllFaculties).toHaveBeenCalledWith({
                page: 2,
                limit: 10,
                search: 'CNTT',
            })
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockResult)
        })
    })

    describe('getFacultyById', () => {
        it('should get faculty by id successfully', async () => {
            req.params = { id: '1' }
            const mockFaculty = { id: 1, code: 'CNTT', name: 'Cong nghe thong tin' }
            ;(facultyService.getFacultyById as jest.Mock).mockResolvedValue(mockFaculty)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await facultyController.getFacultyById(req, res, next)

            expect(facultyService.getFacultyById).toHaveBeenCalledWith(1)
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockFaculty)
        })

        it('should call next with error when service throws', async () => {
            req.params = { id: '1' }
            const error = new Error('Service error')
            ;(facultyService.getFacultyById as jest.Mock).mockRejectedValue(error)

            await facultyController.getFacultyById(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe('getFacultyByCode', () => {
        it('should get faculty by code successfully', async () => {
            req.params = { code: 'CNTT' }
            const mockFaculty = { id: 1, code: 'CNTT', name: 'Cong nghe thong tin' }
            ;(facultyService.getFacultyByCode as jest.Mock).mockResolvedValue(mockFaculty)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await facultyController.getFacultyByCode(req, res, next)

            expect(facultyService.getFacultyByCode).toHaveBeenCalledWith('CNTT')
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockFaculty)
        })

        it('should call next with error when service throws', async () => {
            req.params = { code: 'CNTT' }
            const error = new Error('Service error')
            ;(facultyService.getFacultyByCode as jest.Mock).mockRejectedValue(error)

            await facultyController.getFacultyByCode(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe('getFacultyStats', () => {
        it('should get faculty stats successfully', async () => {
            req.params = { id: '1' }
            const mockResult = {
                faculty: { id: 1, code: 'CNTT', name: 'Cong nghe thong tin' },
                stats: { totalStudents: 100, totalUsers: 50, totalClubs: 5, totalPoints: 1000 },
            }
            ;(facultyService.getFacultyStats as jest.Mock).mockResolvedValue(mockResult)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await facultyController.getFacultyStats(req, res, next)

            expect(facultyService.getFacultyStats).toHaveBeenCalledWith(1)
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockResult)
        })

        it('should call next with error when service throws', async () => {
            req.params = { id: '1' }
            const error = new Error('Service error')
            ;(facultyService.getFacultyStats as jest.Mock).mockRejectedValue(error)

            await facultyController.getFacultyStats(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe('getFacultiesList', () => {
        it('should get all faculties list successfully', async () => {
            const mockFaculties = [
                { id: 1, code: 'CNTT', name: 'Cong nghe thong tin' },
                { id: 2, code: 'DT', name: 'Dien tu' },
            ]
            ;(facultyService.getFacultiesList as jest.Mock).mockResolvedValue(mockFaculties)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await facultyController.getFacultiesList(req, res, next)

            expect(facultyService.getFacultiesList).toHaveBeenCalled()
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockFaculties)
        })

        it('should call next with error when service throws', async () => {
            const error = new Error('Service error')
            ;(facultyService.getFacultiesList as jest.Mock).mockRejectedValue(error)

            await facultyController.getFacultiesList(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })
})