import { Response, NextFunction } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiResponse } from 'src/utils/ApiResponse'
import * as moneyDonationService from '../money-donation.service'
import * as moneyDonationController from '../money-donation.controller'

jest.mock('../money-donation.service')
jest.mock('src/utils/ApiResponse')

describe('MoneyDonation Controller', () => {
    let req: any
    let res: any
    let next: NextFunction

    beforeEach(() => {
        req = {
            params: {},
            query: {},
            body: {},
            payload: {},
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('createMoneyPhase', () => {
        it('should return UNAUTHORIZED if no userId in payload', async () => {
            req.params = { campaignId: 'camp-1' }
            req.payload = undefined
            ;(ApiResponse.error as jest.Mock).mockReturnValue({})

            await moneyDonationController.createMoneyPhase(req, res, next)

            expect(ApiResponse.error).toHaveBeenCalledWith(
                res,
                'Chưa xác thực người dùng',
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should create money phase successfully', async () => {
            req.params = { campaignId: 'camp-1' }
            req.payload = { userId: 'user-1', role: 'CLB' }
            req.body = {
                targetAmount: 1000000,
                bankCode: 'VCB',
                bankAccountNo: '123456',
                bankAccountName: 'Test',
            }
            const mockPhase = { id: 1, campaignId: 'camp-1', targetAmount: BigInt(1000000) }
            ;(moneyDonationService.createMoneyPhase as jest.Mock).mockResolvedValue(mockPhase)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await moneyDonationController.createMoneyPhase(req, res, next)

            expect(moneyDonationService.createMoneyPhase).toHaveBeenCalledWith(
                'camp-1',
                req.body,
                'user-1',
                'CLB'
            )
            expect(ApiResponse.success).toHaveBeenCalledWith(
                res,
                mockPhase,
                'Tạo giai đoạn quyên góp tiền thành công',
                HttpStatus.CREATED
            )
        })
    })

    describe('getMoneyPhase', () => {
        it('should return money phase', async () => {
            req.params = { phaseId: '1' }
            const mockPhase = { id: 1, campaignId: 'camp-1' }
            ;(moneyDonationService.getMoneyPhaseById as jest.Mock).mockResolvedValue(mockPhase)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await moneyDonationController.getMoneyPhase(req, res, next)

            expect(moneyDonationService.getMoneyPhaseById).toHaveBeenCalledWith(1)
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockPhase)
        })
    })

    describe('updateMoneyPhase', () => {
        it('should return UNAUTHORIZED if no userId in payload', async () => {
            req.params = { phaseId: '1' }
            req.payload = undefined
            ;(ApiResponse.error as jest.Mock).mockReturnValue({})

            await moneyDonationController.updateMoneyPhase(req, res, next)

            expect(ApiResponse.error).toHaveBeenCalledWith(
                res,
                'Chưa xác thực người dùng',
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should update money phase successfully', async () => {
            req.params = { phaseId: '1' }
            req.payload = { userId: 'user-1', role: 'CLB' }
            req.body = { targetAmount: 2000000 }
            const mockPhase = { id: 1, targetAmount: BigInt(2000000) }
            ;(moneyDonationService.updateMoneyPhase as jest.Mock).mockResolvedValue(mockPhase)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await moneyDonationController.updateMoneyPhase(req, res, next)

            expect(moneyDonationService.updateMoneyPhase).toHaveBeenCalledWith(
                1,
                req.body,
                'user-1',
                'CLB'
            )
            expect(ApiResponse.success).toHaveBeenCalledWith(
                res,
                mockPhase,
                'Cập nhật giai đoạn quyên góp tiền thành công'
            )
        })
    })

    describe('deleteMoneyPhase', () => {
        it('should return UNAUTHORIZED if no userId in payload', async () => {
            req.params = { phaseId: '1' }
            req.payload = undefined
            ;(ApiResponse.error as jest.Mock).mockReturnValue({})

            await moneyDonationController.deleteMoneyPhase(req, res, next)

            expect(ApiResponse.error).toHaveBeenCalledWith(
                res,
                'Chưa xác thực người dùng',
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should delete money phase successfully', async () => {
            req.params = { phaseId: '1' }
            req.payload = { userId: 'user-1', role: 'CLB' }
            ;(moneyDonationService.deleteMoneyPhase as jest.Mock).mockResolvedValue({
                message: 'Xóa giai đoạn quyên góp thành công',
            })
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await moneyDonationController.deleteMoneyPhase(req, res, next)

            expect(moneyDonationService.deleteMoneyPhase).toHaveBeenCalledWith(1, 'user-1', 'CLB')
            expect(ApiResponse.success).toHaveBeenCalledWith(res, null, 'Xóa giai đoạn quyên góp thành công')
        })
    })

    describe('getPhaseProgress', () => {
        it('should return phase progress', async () => {
            req.params = { phaseId: '1' }
            const mockProgress = { phaseId: 1, targetAmount: '1000000', currentAmount: '500000', percentage: 50 }
            ;(moneyDonationService.getPhaseProgress as jest.Mock).mockResolvedValue(mockProgress)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await moneyDonationController.getPhaseProgress(req, res, next)

            expect(moneyDonationService.getPhaseProgress).toHaveBeenCalledWith(1)
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockProgress)
        })
    })

    describe('getPhaseDonations', () => {
        it('should return UNAUTHORIZED if no userId in payload', async () => {
            req.params = { phaseId: '1' }
            req.payload = undefined
            ;(ApiResponse.error as jest.Mock).mockReturnValue({})

            await moneyDonationController.getPhaseDonations(req, res, next)

            expect(ApiResponse.error).toHaveBeenCalledWith(
                res,
                'Chưa xác thực người dùng',
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should return donations with default pagination', async () => {
            req.params = { phaseId: '1' }
            req.payload = { userId: 'user-1', role: 'CLB' }
            const mockResult = { donations: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }
            ;(moneyDonationService.getPhaseDonations as jest.Mock).mockResolvedValue(mockResult)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await moneyDonationController.getPhaseDonations(req, res, next)

            expect(moneyDonationService.getPhaseDonations).toHaveBeenCalledWith(
                1,
                { status: undefined, page: 1, limit: 10 },
                'user-1',
                'CLB'
            )
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockResult)
        })

        it('should pass query parameters', async () => {
            req.params = { phaseId: '1' }
            req.payload = { userId: 'user-1', role: 'CLB' }
            req.query = { status: 'PENDING', page: '2', limit: '20' }
            const mockResult = { donations: [], meta: { total: 0, page: 2, limit: 20, totalPages: 0 } }
            ;(moneyDonationService.getPhaseDonations as jest.Mock).mockResolvedValue(mockResult)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await moneyDonationController.getPhaseDonations(req, res, next)

            expect(moneyDonationService.getPhaseDonations).toHaveBeenCalledWith(
                1,
                { status: 'PENDING', page: 2, limit: 20 },
                'user-1',
                'CLB'
            )
        })
    })
})