import { Response } from 'express'
import { NextFunction } from 'express'
import {
    createTitle,
    updateTitle,
    deleteTitle,
    getAllTitles,
    getTitleById,
} from 'src/features/title/title.controller'
import * as titleService from '../title.service'
import { HttpStatus } from 'src/common/constants'

jest.mock('src/config', () => ({
    prismaClient: {},
    config: {
        node_env: 'test',
    },
}))
jest.mock('../title.service')

describe('Title Controller', () => {
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
            sendStatus: jest.fn().mockReturnThis(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('createTitle', () => {
        it('should create title and return success response', async () => {
            const input = {
                name: 'Gold Member',
                description: 'Gold level',
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
            req.body = input
            ;(titleService.createTitle as jest.Mock).mockResolvedValue(mockTitle)

            await createTitle(req, res, next)

            expect(titleService.createTitle).toHaveBeenCalledWith(input)
            expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockTitle,
                message: 'Tạo danh hiệu thành công',
            })
        })

        it('should create title with required fields only', async () => {
            const input = {
                name: 'Bronze Member',
                minPoints: 10,
            }
            const mockTitle = {
                id: 1,
                ...input,
                description: null,
                iconUrl: null,
                badgeColor: null,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            req.body = input
            ;(titleService.createTitle as jest.Mock).mockResolvedValue(mockTitle)

            await createTitle(req, res, next)

            expect(titleService.createTitle).toHaveBeenCalledWith(input)
            expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED)
        })

        it('should call next with error when service throws error', async () => {
            const input = { name: 'Test', minPoints: 100 }
            req.body = input
            const error = new Error('Service error')
            ;(titleService.createTitle as jest.Mock).mockRejectedValue(error)

            await createTitle(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
            expect(res.json).not.toHaveBeenCalled()
        })

        it('should call next with ApiError when duplicate minPoints', async () => {
            const input = { name: 'Test', minPoints: 100 }
            req.body = input
            const apiError = new Error('Đã tồn tại danh hiệu với mức điểm này')
            ;(titleService.createTitle as jest.Mock).mockRejectedValue(apiError)

            await createTitle(req, res, next)

            expect(next).toHaveBeenCalledWith(apiError)
        })
    })

    describe('updateTitle', () => {
        it('should update title and return success response', async () => {
            const updateData = {
                name: 'Updated Name',
                description: 'Updated description',
            }
            const mockTitle = {
                id: 1,
                name: 'Updated Name',
                description: 'Updated description',
                minPoints: 100,
                isActive: true,
            }
            req.params = { id: '1' }
            req.body = updateData
            ;(titleService.updateTitle as jest.Mock).mockResolvedValue(mockTitle)

            await updateTitle(req, res, next)

            expect(titleService.updateTitle).toHaveBeenCalledWith(1, updateData)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockTitle,
                message: 'Cập nhật danh hiệu thành công',
            })
        })

        it('should update isActive field', async () => {
            const mockTitle = {
                id: 1,
                name: 'Test',
                minPoints: 100,
                isActive: false,
            }
            req.params = { id: '1' }
            req.body = { isActive: false }
            ;(titleService.updateTitle as jest.Mock).mockResolvedValue(mockTitle)

            await updateTitle(req, res, next)

            expect(titleService.updateTitle).toHaveBeenCalledWith(1, {
                isActive: false,
            })
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockTitle,
                message: 'Cập nhật danh hiệu thành công',
            })
        })

        it('should parse id as number from params', async () => {
            req.params = { id: '123' }
            req.body = { name: 'Test' }
            ;(titleService.updateTitle as jest.Mock).mockResolvedValue({})

            await updateTitle(req, res, next)

            expect(titleService.updateTitle).toHaveBeenCalledWith(123, {
                name: 'Test',
            })
        })

        it('should call next with error when service throws error', async () => {
            req.params = { id: '1' }
            req.body = { name: 'Test' }
            const error = new Error('Service error')
            ;(titleService.updateTitle as jest.Mock).mockRejectedValue(error)

            await updateTitle(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })

        it('should call next with error when title not found', async () => {
            req.params = { id: '999' }
            req.body = { name: 'Test' }
            const notFoundError = new Error('Không tìm thấy danh hiệu')
            ;(titleService.updateTitle as jest.Mock).mockRejectedValue(
                notFoundError
            )

            await updateTitle(req, res, next)

            expect(next).toHaveBeenCalledWith(notFoundError)
        })
    })

    describe('deleteTitle', () => {
        it('should delete title and return success response', async () => {
            req.params = { id: '1' }
            ;(titleService.deleteTitle as jest.Mock).mockResolvedValue(undefined)

            await deleteTitle(req, res, next)

            expect(titleService.deleteTitle).toHaveBeenCalledWith(1)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: null,
                message: 'Xóa danh hiệu thành công',
            })
        })

        it('should parse id as number from params', async () => {
            req.params = { id: '456' }
            ;(titleService.deleteTitle as jest.Mock).mockResolvedValue(undefined)

            await deleteTitle(req, res, next)

            expect(titleService.deleteTitle).toHaveBeenCalledWith(456)
        })

        it('should call next with error when service throws error', async () => {
            req.params = { id: '1' }
            const error = new Error('Service error')
            ;(titleService.deleteTitle as jest.Mock).mockRejectedValue(error)

            await deleteTitle(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })

        it('should call next with error when title not found', async () => {
            req.params = { id: '999' }
            const notFoundError = new Error('Không tìm thấy danh hiệu')
            ;(titleService.deleteTitle as jest.Mock).mockRejectedValue(
                notFoundError
            )

            await deleteTitle(req, res, next)

            expect(next).toHaveBeenCalledWith(notFoundError)
        })
    })

    describe('getAllTitles', () => {
        it('should return all titles without pagination params', async () => {
            const mockResult = {
                items: [
                    { id: 1, name: 'Bronze', minPoints: 10, isActive: true },
                    { id: 2, name: 'Silver', minPoints: 50, isActive: true },
                ],
                meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
            }
            ;(titleService.getAllTitles as jest.Mock).mockResolvedValue(mockResult)

            await getAllTitles(req, res, next)

            expect(titleService.getAllTitles).toHaveBeenCalledWith({
                page: undefined,
                limit: undefined,
                isActive: undefined,
            })
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockResult,
                message: 'Success',
            })
        })

        it('should return titles with pagination params', async () => {
            const mockResult = {
                items: [{ id: 3, name: 'Gold', minPoints: 100 }],
                meta: { total: 25, page: 2, limit: 5, totalPages: 5 },
            }
            req.query = { page: '2', limit: '5' }
            ;(titleService.getAllTitles as jest.Mock).mockResolvedValue(mockResult)

            await getAllTitles(req, res, next)

            expect(titleService.getAllTitles).toHaveBeenCalledWith({
                page: 2,
                limit: 5,
                isActive: undefined,
            })
        })

        it('should return titles filtered by isActive true', async () => {
            const mockResult = {
                items: [{ id: 1, name: 'Active', minPoints: 10, isActive: true }],
                meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
            }
            req.query = { isActive: 'true' }
            ;(titleService.getAllTitles as jest.Mock).mockResolvedValue(mockResult)

            await getAllTitles(req, res, next)

            expect(titleService.getAllTitles).toHaveBeenCalledWith({
                page: undefined,
                limit: undefined,
                isActive: true,
            })
        })

        it('should return titles filtered by isActive false', async () => {
            const mockResult = {
                items: [
                    { id: 2, name: 'Inactive', minPoints: 0, isActive: false },
                ],
                meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
            }
            req.query = { isActive: 'false' }
            ;(titleService.getAllTitles as jest.Mock).mockResolvedValue(mockResult)

            await getAllTitles(req, res, next)

            expect(titleService.getAllTitles).toHaveBeenCalledWith({
                page: undefined,
                limit: undefined,
                isActive: false,
            })
        })

        it('should return titles with all query params', async () => {
            const mockResult = {
                items: [{ id: 1, name: 'Test', minPoints: 10, isActive: true }],
                meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
            }
            req.query = { page: '1', limit: '10', isActive: 'true' }
            ;(titleService.getAllTitles as jest.Mock).mockResolvedValue(mockResult)

            await getAllTitles(req, res, next)

            expect(titleService.getAllTitles).toHaveBeenCalledWith({
                page: 1,
                limit: 10,
                isActive: true,
            })
        })

        it('should not set isActive when value is not true or false', async () => {
            const mockResult = {
                items: [],
                meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
            }
            req.query = { isActive: 'invalid' }
            ;(titleService.getAllTitles as jest.Mock).mockResolvedValue(mockResult)

            await getAllTitles(req, res, next)

            expect(titleService.getAllTitles).toHaveBeenCalledWith({
                page: undefined,
                limit: undefined,
                isActive: undefined,
            })
        })

        it('should call next with error when service throws error', async () => {
            const error = new Error('Service error')
            ;(titleService.getAllTitles as jest.Mock).mockRejectedValue(error)

            await getAllTitles(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })
    })

    describe('getTitleById', () => {
        it('should return title by id', async () => {
            const mockTitle = {
                id: 1,
                name: 'Gold Member',
                minPoints: 100,
                isActive: true,
            }
            req.params = { id: '1' }
            ;(titleService.getTitleById as jest.Mock).mockResolvedValue(mockTitle)

            await getTitleById(req, res, next)

            expect(titleService.getTitleById).toHaveBeenCalledWith(1)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockTitle,
                message: 'Success',
            })
        })

        it('should parse id as number from params', async () => {
            const mockTitle = { id: 789, name: 'Test' }
            req.params = { id: '789' }
            ;(titleService.getTitleById as jest.Mock).mockResolvedValue(mockTitle)

            await getTitleById(req, res, next)

            expect(titleService.getTitleById).toHaveBeenCalledWith(789)
        })

        it('should call next with error when service throws error', async () => {
            req.params = { id: '1' }
            const error = new Error('Service error')
            ;(titleService.getTitleById as jest.Mock).mockRejectedValue(error)

            await getTitleById(req, res, next)

            expect(next).toHaveBeenCalledWith(error)
        })

        it('should call next with error when title not found', async () => {
            req.params = { id: '999' }
            const notFoundError = new Error('Không tìm thấy danh hiệu')
            ;(titleService.getTitleById as jest.Mock).mockRejectedValue(
                notFoundError
            )

            await getTitleById(req, res, next)

            expect(next).toHaveBeenCalledWith(notFoundError)
        })
    })
})