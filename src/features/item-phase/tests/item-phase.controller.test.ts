import { Response, NextFunction } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiResponse } from 'src/utils/ApiResponse'
import { ApiError } from 'src/utils/ApiError'
import * as itemPhaseService from '../item-phase.service'
import * as itemPhaseController from '../item-phase.controller'

jest.mock('../item-phase.service')
jest.mock('src/utils/ApiResponse')

describe('ItemPhase Controller', () => {
    let req: any
    let res: any
    let next: NextFunction

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            payload: {},
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('createItemPhase', () => {
        it('should return UNAUTHORIZED error if no userId in payload', async () => {
            req.payload = undefined

            await itemPhaseController.createItemPhase(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(HttpStatus.UNAUTHORIZED)
            expect((next as jest.Mock).mock.calls[0][0].message).toBe('Chưa xác thực người dùng')
        })

        it('should create item phase successfully', async () => {
            req.payload = { userId: 'user-1' }
            req.params = { campaignId: 'campaign-1' }
            req.body = { acceptedItems: ['Book', 'Clothes'], collectionAddress: 'Address 1' }
            const mockItemPhase = {
                id: 1,
                campaignId: 'campaign-1',
                acceptedItems: JSON.stringify(['Book', 'Clothes']),
                collectionAddress: 'Address 1',
            }
            ;(itemPhaseService.createItemPhase as jest.Mock).mockResolvedValue(mockItemPhase)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await itemPhaseController.createItemPhase(req, res, next)

            expect(itemPhaseService.createItemPhase).toHaveBeenCalledWith(
                'campaign-1',
                'user-1',
                req.body
            )
            expect(ApiResponse.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    id: 1,
                    campaignId: 'campaign-1',
                    acceptedItems: ['Book', 'Clothes'],
                }),
                'Tạo giai đoạn quyên góp hiện vật thành công',
                HttpStatus.CREATED
            )
        })

        it('should handle array campaignId parameter', async () => {
            req.payload = { userId: 'user-1' }
            req.params = { campaignId: ['campaign-1'] }
            req.body = { acceptedItems: ['Book'] }
            const mockItemPhase = {
                id: 1,
                campaignId: 'campaign-1',
                acceptedItems: JSON.stringify(['Book']),
            }
            ;(itemPhaseService.createItemPhase as jest.Mock).mockResolvedValue(mockItemPhase)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await itemPhaseController.createItemPhase(req, res, next)

            expect(itemPhaseService.createItemPhase).toHaveBeenCalledWith(
                'campaign-1',
                'user-1',
                req.body
            )
        })
    })

    describe('updateItemPhase', () => {
        it('should return UNAUTHORIZED error if no userId in payload', async () => {
            req.payload = undefined

            await itemPhaseController.updateItemPhase(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(HttpStatus.UNAUTHORIZED)
            expect((next as jest.Mock).mock.calls[0][0].message).toBe('Chưa xác thực người dùng')
        })

        it('should update item phase successfully', async () => {
            req.payload = { userId: 'user-1' }
            req.params = { campaignId: 'campaign-1', phaseId: '1' }
            req.body = { acceptedItems: ['Book', 'Clothes', 'Toys'] }
            const mockItemPhase = {
                id: 1,
                campaignId: 'campaign-1',
                acceptedItems: JSON.stringify(['Book', 'Clothes', 'Toys']),
            }
            ;(itemPhaseService.updateItemPhase as jest.Mock).mockResolvedValue(mockItemPhase)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await itemPhaseController.updateItemPhase(req, res, next)

            expect(itemPhaseService.updateItemPhase).toHaveBeenCalledWith(
                'campaign-1',
                1,
                'user-1',
                req.body
            )
            expect(ApiResponse.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    id: 1,
                    acceptedItems: ['Book', 'Clothes', 'Toys'],
                }),
                'Cập nhật thành công'
            )
        })

        it('should handle array parameters', async () => {
            req.payload = { userId: 'user-1' }
            req.params = { campaignId: ['campaign-1'], phaseId: ['2'] }
            req.body = { collectionAddress: 'New Address' }
            const mockItemPhase = {
                id: 2,
                campaignId: 'campaign-1',
                acceptedItems: JSON.stringify([]),
                collectionAddress: 'New Address',
            }
            ;(itemPhaseService.updateItemPhase as jest.Mock).mockResolvedValue(mockItemPhase)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await itemPhaseController.updateItemPhase(req, res, next)

            expect(itemPhaseService.updateItemPhase).toHaveBeenCalledWith(
                'campaign-1',
                2,
                'user-1',
                req.body
            )
        })
    })

    describe('getItemPhaseByCampaignId', () => {
        it('should return item phase by campaign id', async () => {
            req.params = { campaignId: 'campaign-1' }
            const mockItemPhase = {
                id: 1,
                campaignId: 'campaign-1',
                acceptedItems: JSON.stringify(['Book']),
            }
            ;(itemPhaseService.getItemPhaseByCampaignId as jest.Mock).mockResolvedValue(
                mockItemPhase
            )
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await itemPhaseController.getItemPhaseByCampaignId(req, res, next)

            expect(itemPhaseService.getItemPhaseByCampaignId).toHaveBeenCalledWith(
                'campaign-1'
            )
            expect(ApiResponse.success).toHaveBeenCalledWith(
                res,
                expect.objectContaining({
                    id: 1,
                    acceptedItems: ['Book'],
                })
            )
        })
    })

    describe('deleteItemPhase', () => {
        it('should return UNAUTHORIZED error if no userId in payload', async () => {
            req.payload = undefined

            await itemPhaseController.deleteItemPhase(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(HttpStatus.UNAUTHORIZED)
            expect((next as jest.Mock).mock.calls[0][0].message).toBe('Chưa xác thực người dùng')
        })

        it('should delete item phase successfully', async () => {
            req.payload = { userId: 'user-1' }
            req.params = { campaignId: 'campaign-1', phaseId: '1' }
            ;(itemPhaseService.deleteItemPhase as jest.Mock).mockResolvedValue(undefined)
            res.status = jest.fn().mockReturnThis()
            res.send = jest.fn()

            await itemPhaseController.deleteItemPhase(req, res, next)

            expect(itemPhaseService.deleteItemPhase).toHaveBeenCalledWith(
                'campaign-1',
                1,
                'user-1'
            )
            expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT)
            expect(res.send).toHaveBeenCalled()
        })

        it('should handle array parameters for delete', async () => {
            req.payload = { userId: 'user-1' }
            req.params = { campaignId: ['campaign-2'], phaseId: ['5'] }
            ;(itemPhaseService.deleteItemPhase as jest.Mock).mockResolvedValue(undefined)
            res.status = jest.fn().mockReturnThis()
            res.send = jest.fn()

            await itemPhaseController.deleteItemPhase(req, res, next)

            expect(itemPhaseService.deleteItemPhase).toHaveBeenCalledWith(
                'campaign-2',
                5,
                'user-1'
            )
        })
    })
})
