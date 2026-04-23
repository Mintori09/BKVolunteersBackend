import { Response, NextFunction } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import * as itemDonationService from '../item-donation.service'
import * as itemDonationController from '../item-donation.controller'

jest.mock('../item-donation.service')

describe('ItemDonation Controller', () => {
    let req: any
    let res: any
    let next: jest.Mock

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            query: {},
            payload: {},
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('createItemDonation', () => {
        it('should call next with UNAUTHORIZED error if no studentId in payload', async () => {
            req.payload = undefined

            await itemDonationController.createItemDonation(req, res, next)

            expect(next).toHaveBeenCalled()
            const error = next.mock.calls[0][0]
            expect(error).toBeInstanceOf(ApiError)
            expect(error.statusCode).toBe(HttpStatus.UNAUTHORIZED)
        })

        it('should call next with UNAUTHORIZED error if userId is undefined', async () => {
            req.payload = { userId: undefined }

            await itemDonationController.createItemDonation(req, res, next)

            expect(next).toHaveBeenCalled()
            const error = next.mock.calls[0][0]
            expect(error).toBeInstanceOf(ApiError)
            expect(error.statusCode).toBe(HttpStatus.UNAUTHORIZED)
        })

        it('should create item donation successfully', async () => {
            req.payload = { userId: 'student-1' }
            req.body = {
                itemPhaseId: 1,
                itemDescription: 'Sách giáo khoa',
                proofImageUrl: 'https://example.com/proof.jpg',
            }
            const mockDonation = {
                id: 'don-1',
                status: 'PENDING',
                itemDescription: 'Sách giáo khoa',
            }
            ;(itemDonationService.createItemDonation as jest.Mock).mockResolvedValue(mockDonation)

            await itemDonationController.createItemDonation(req, res, next)

            expect(itemDonationService.createItemDonation).toHaveBeenCalledWith(
                'student-1',
                req.body
            )
            expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Ghi nhận đóng góp thành công, chờ xác minh',
                data: mockDonation,
            })
        })

        it('should create item donation without proofImageUrl', async () => {
            req.payload = { userId: 'student-1' }
            req.body = {
                itemPhaseId: 1,
                itemDescription: 'Quần áo cũ',
            }
            const mockDonation = {
                id: 'don-1',
                status: 'PENDING',
                itemDescription: 'Quần áo cũ',
            }
            ;(itemDonationService.createItemDonation as jest.Mock).mockResolvedValue(mockDonation)

            await itemDonationController.createItemDonation(req, res, next)

            expect(itemDonationService.createItemDonation).toHaveBeenCalledWith(
                'student-1',
                req.body
            )
            expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED)
        })
    })

    describe('getItemDonationsByPhase', () => {
        it('should call next with UNAUTHORIZED error if no userId in payload', async () => {
            req.payload = undefined
            req.params = { phaseId: '1' }

            await itemDonationController.getItemDonationsByPhase(req, res, next)

            expect(next).toHaveBeenCalled()
            const error = next.mock.calls[0][0]
            expect(error).toBeInstanceOf(ApiError)
            expect(error.statusCode).toBe(HttpStatus.UNAUTHORIZED)
        })

        it('should call next with UNAUTHORIZED error if userId is undefined', async () => {
            req.payload = { userId: undefined }
            req.params = { phaseId: '1' }

            await itemDonationController.getItemDonationsByPhase(req, res, next)

            expect(next).toHaveBeenCalled()
            const error = next.mock.calls[0][0]
            expect(error).toBeInstanceOf(ApiError)
            expect(error.statusCode).toBe(HttpStatus.UNAUTHORIZED)
        })

        it('should get item donations by phase with default pagination', async () => {
            req.payload = { userId: 'user-1' }
            req.params = { phaseId: '1' }
            req.query = {}
            const mockResult = {
                items: [],
                pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
            }
            ;(itemDonationService.getItemDonationsByPhase as jest.Mock).mockResolvedValue(mockResult)

            await itemDonationController.getItemDonationsByPhase(req, res, next)

            expect(itemDonationService.getItemDonationsByPhase).toHaveBeenCalledWith(1, 'user-1', {
                status: undefined,
                page: undefined,
                limit: undefined,
            })
            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Success',
                data: mockResult,
            })
        })

        it('should get item donations with custom pagination', async () => {
            req.payload = { userId: 'user-1' }
            req.params = { phaseId: '2' }
            req.query = { page: '2', limit: '5' }
            const mockResult = {
                items: [],
                pagination: { page: 2, limit: 5, total: 0, totalPages: 0 },
            }
            ;(itemDonationService.getItemDonationsByPhase as jest.Mock).mockResolvedValue(mockResult)

            await itemDonationController.getItemDonationsByPhase(req, res, next)

            expect(itemDonationService.getItemDonationsByPhase).toHaveBeenCalledWith(2, 'user-1', {
                status: undefined,
                page: 2,
                limit: 5,
            })
        })

        it('should get item donations with status filter', async () => {
            req.payload = { userId: 'user-1' }
            req.params = { phaseId: '1' }
            req.query = { status: 'PENDING' }
            const mockResult = {
                items: [{ id: 'don-1', status: 'PENDING' }],
                pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
            }
            ;(itemDonationService.getItemDonationsByPhase as jest.Mock).mockResolvedValue(mockResult)

            await itemDonationController.getItemDonationsByPhase(req, res, next)

            expect(itemDonationService.getItemDonationsByPhase).toHaveBeenCalledWith(1, 'user-1', {
                status: 'PENDING',
                page: undefined,
                limit: undefined,
            })
        })

        it('should handle array params and query params', async () => {
            req.payload = { userId: 'user-1' }
            req.params = { phaseId: ['1', '2'] }
            req.query = { status: ['PENDING', 'VERIFIED'], page: ['2', '3'], limit: ['5', '10'] }
            const mockResult = {
                items: [],
                pagination: { page: 2, limit: 5, total: 0, totalPages: 0 },
            }
            ;(itemDonationService.getItemDonationsByPhase as jest.Mock).mockResolvedValue(mockResult)

            await itemDonationController.getItemDonationsByPhase(req, res, next)

            expect(itemDonationService.getItemDonationsByPhase).toHaveBeenCalledWith(1, 'user-1', {
                status: 'PENDING',
                page: 2,
                limit: 5,
            })
        })

        it('should handle empty string phaseId', async () => {
            req.payload = { userId: 'user-1' }
            req.params = { phaseId: '' }
            req.query = {}
            const mockResult = {
                items: [],
                pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
            }
            ;(itemDonationService.getItemDonationsByPhase as jest.Mock).mockResolvedValue(mockResult)

            await itemDonationController.getItemDonationsByPhase(req, res, next)

            expect(itemDonationService.getItemDonationsByPhase).toHaveBeenCalledWith(NaN, 'user-1', {
                status: undefined,
                page: undefined,
                limit: undefined,
            })
        })

        it('should handle all query parameters combined', async () => {
            req.payload = { userId: 'user-1' }
            req.params = { phaseId: '5' }
            req.query = { status: 'VERIFIED', page: '3', limit: '20' }
            const mockResult = {
                items: [],
                pagination: { page: 3, limit: 20, total: 0, totalPages: 0 },
            }
            ;(itemDonationService.getItemDonationsByPhase as jest.Mock).mockResolvedValue(mockResult)

            await itemDonationController.getItemDonationsByPhase(req, res, next)

            expect(itemDonationService.getItemDonationsByPhase).toHaveBeenCalledWith(5, 'user-1', {
                status: 'VERIFIED',
                page: 3,
                limit: 20,
            })
        })
    })

    describe('verifyItemDonation', () => {
        it('should verify item donation successfully', async () => {
            req.payload = { userId: 'user-1' }
            req.params = { id: 'don-1' }
            req.body = { points: 5 }
            ;(itemDonationService.verifyItemDonation as jest.Mock).mockResolvedValue(
                {
                    id: 'don-1',
                    status: 'VERIFIED',
                }
            )

            await itemDonationController.verifyItemDonation(req, res, next)

            expect(itemDonationService.verifyItemDonation).toHaveBeenCalledWith(
                'don-1',
                { points: 5 },
                'user-1'
            )
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Xác thực đóng góp hiện vật thành công',
                data: {
                    id: 'don-1',
                    status: 'VERIFIED',
                },
            })
        })
    })
})
