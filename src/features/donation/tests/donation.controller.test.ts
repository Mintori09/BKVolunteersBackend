import { Response, NextFunction } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiResponse } from 'src/utils/ApiResponse'
import * as donationService from '../donation.service'
import * as donationController from '../donation.controller'

jest.mock('../donation.service')
jest.mock('src/utils/ApiResponse')

describe('Donation Controller', () => {
    let req: any
    let res: any
    let next: NextFunction

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

    describe('submitDonation', () => {
        it('should return UNAUTHORIZED error if no userId in payload', async () => {
            req.payload = undefined
            ;(ApiResponse.error as jest.Mock).mockReturnValue({})

            await donationController.submitDonation(req, res, next)

            expect(ApiResponse.error).toHaveBeenCalledWith(
                res,
                'Chưa xác thực người dùng',
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should submit donation successfully', async () => {
            req.payload = { userId: 'student-1' }
            req.body = { moneyPhaseId: 1, amount: 100000, proofImageUrl: 'url' }
            const mockDonation = { id: 'don-1', status: 'PENDING' }
            ;(donationService.submitDonation as jest.Mock).mockResolvedValue(mockDonation)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await donationController.submitDonation(req, res, next)

            expect(donationService.submitDonation).toHaveBeenCalledWith('student-1', req.body)
            expect(ApiResponse.success).toHaveBeenCalledWith(
                res,
                mockDonation,
                'Đóng góp đã được ghi nhận, chờ xác thực',
                HttpStatus.CREATED
            )
        })
    })

    describe('rejectDonation', () => {
        it('should return UNAUTHORIZED error if no userId in payload', async () => {
            req.payload = undefined
            ;(ApiResponse.error as jest.Mock).mockReturnValue({})

            await donationController.rejectDonation(req, res, next)

            expect(ApiResponse.error).toHaveBeenCalledWith(
                res,
                'Chưa xác thực người dùng',
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should reject donation successfully', async () => {
            req.params = { id: 'don-1' }
            req.payload = { userId: 'user-1', role: 'CLB' }
            req.body = { reason: 'Invalid proof' }
            const mockDonation = { id: 'don-1', status: 'REJECTED' }
            ;(donationService.rejectDonation as jest.Mock).mockResolvedValue(mockDonation)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await donationController.rejectDonation(req, res, next)

            expect(donationService.rejectDonation).toHaveBeenCalledWith(
                'don-1',
                req.body,
                'user-1',
                'CLB'
            )
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockDonation, 'Đã từ chối đóng góp')
        })
    })

    describe('verifyDonation', () => {
        it('should return UNAUTHORIZED error if no userId in payload', async () => {
            req.payload = undefined
            ;(ApiResponse.error as jest.Mock).mockReturnValue({})

            await donationController.verifyDonation(req, res, next)

            expect(ApiResponse.error).toHaveBeenCalledWith(
                res,
                'Chưa xác thực người dùng',
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should verify donation successfully', async () => {
            req.params = { id: 'don-1' }
            req.payload = { userId: 'user-1', role: 'CLB' }
            req.body = { verifiedAmount: 50000 }
            const mockDonation = { id: 'don-1', status: 'VERIFIED' }
            ;(donationService.verifyDonation as jest.Mock).mockResolvedValue(mockDonation)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await donationController.verifyDonation(req, res, next)

            expect(donationService.verifyDonation).toHaveBeenCalledWith(
                'don-1',
                req.body,
                'user-1',
                'CLB'
            )
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockDonation, 'Đã xác thực đóng góp')
        })
    })

    describe('getMyDonations', () => {
        it('should return UNAUTHORIZED error if no userId in payload', async () => {
            req.payload = undefined
            ;(ApiResponse.error as jest.Mock).mockReturnValue({})

            await donationController.getMyDonations(req, res, next)

            expect(ApiResponse.error).toHaveBeenCalledWith(
                res,
                'Chưa xác thực người dùng',
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should get my donations with default pagination', async () => {
            req.payload = { userId: 'student-1' }
            req.query = {}
            const mockResult = { donations: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } }
            ;(donationService.getMyDonations as jest.Mock).mockResolvedValue(mockResult)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await donationController.getMyDonations(req, res, next)

            expect(donationService.getMyDonations).toHaveBeenCalledWith('student-1', {
                status: undefined,
                page: 1,
                limit: 10,
            })
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockResult)
        })

        it('should get my donations with custom pagination and status', async () => {
            req.payload = { userId: 'student-1' }
            req.query = { status: 'PENDING', page: '2', limit: '5' }
            const mockResult = { donations: [], meta: { total: 0, page: 2, limit: 5, totalPages: 0 } }
            ;(donationService.getMyDonations as jest.Mock).mockResolvedValue(mockResult)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await donationController.getMyDonations(req, res, next)

            expect(donationService.getMyDonations).toHaveBeenCalledWith('student-1', {
                status: 'PENDING',
                page: 2,
                limit: 5,
            })
        })
    })

    describe('getDonationsForAdmin', () => {
        it('should get donations for admin with default pagination', async () => {
            req.query = {}
            const mockResult = { donations: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }
            ;(donationService.getDonationsForAdmin as jest.Mock).mockResolvedValue(mockResult)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await donationController.getDonationsForAdmin(req, res, next)

            expect(donationService.getDonationsForAdmin).toHaveBeenCalledWith({
                status: undefined,
                phaseType: undefined,
                studentId: undefined,
                page: 1,
                limit: 20,
            })
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockResult)
        })

        it('should get donations for admin with filters', async () => {
            req.query = { status: 'VERIFIED', phaseType: 'money', studentId: 'student-1', page: '2', limit: '10' }
            const mockResult = { donations: [], meta: { total: 0, page: 2, limit: 10, totalPages: 0 } }
            ;(donationService.getDonationsForAdmin as jest.Mock).mockResolvedValue(mockResult)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await donationController.getDonationsForAdmin(req, res, next)

            expect(donationService.getDonationsForAdmin).toHaveBeenCalledWith({
                status: 'VERIFIED',
                phaseType: 'money',
                studentId: 'student-1',
                page: 2,
                limit: 10,
            })
        })
    })
})