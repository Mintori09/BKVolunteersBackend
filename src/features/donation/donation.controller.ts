import { Response, Request } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import { TypedRequest } from 'src/types/request'
import * as donationService from './donation.service'
import {
    CreateDonationInput,
    RejectDonationInput,
    VerifyDonationInput,
    UserRole,
} from './donation.types'

export const submitDonation = catchAsync(
    async (req: TypedRequest<CreateDonationInput>, res: Response) => {
        const studentId = req.payload?.userId

        if (!studentId) {
            return ApiResponse.error(
                res,
                'Chưa xác thực người dùng',
                HttpStatus.UNAUTHORIZED
            )
        }

        const donation = await donationService.submitDonation(
            studentId,
            req.body as CreateDonationInput
        )

        return ApiResponse.success(
            res,
            donation,
            'Đóng góp đã được ghi nhận, chờ xác thực',
            HttpStatus.CREATED
        )
    }
)

export const rejectDonation = catchAsync(
    async (req: TypedRequest<RejectDonationInput>, res: Response) => {
        const donationId = req.params.id as string
        const userId = req.payload?.userId
        const userRole = req.payload?.role as UserRole

        if (!userId) {
            return ApiResponse.error(
                res,
                'Chưa xác thực người dùng',
                HttpStatus.UNAUTHORIZED
            )
        }

        const donation = await donationService.rejectDonation(
            donationId,
            req.body as RejectDonationInput,
            userId,
            userRole
        )

        return ApiResponse.success(res, donation, 'Đã từ chối đóng góp')
    }
)

export const verifyDonation = catchAsync(
    async (req: TypedRequest<VerifyDonationInput>, res: Response) => {
        const donationId = req.params.id as string
        const userId = req.payload?.userId
        const userRole = req.payload?.role as UserRole

        if (!userId) {
            return ApiResponse.error(
                res,
                'Chưa xác thực người dùng',
                HttpStatus.UNAUTHORIZED
            )
        }

        const donation = await donationService.verifyDonation(
            donationId,
            req.body as VerifyDonationInput,
            userId,
            userRole
        )

        return ApiResponse.success(res, donation, 'Đã xác thực đóng góp')
    }
)

export const getMyDonations = catchAsync(async (req: Request, res: Response) => {
    const studentId = req.payload?.userId

    if (!studentId) {
        return ApiResponse.error(
            res,
            'Chưa xác thực người dùng',
            HttpStatus.UNAUTHORIZED
        )
    }

    const status = req.query.status as 'PENDING' | 'VERIFIED' | 'REJECTED' | undefined
    const page = req.query.page ? parseInt(req.query.page as string) : 1
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10

    const result = await donationService.getMyDonations(studentId, { status, page, limit })

    return ApiResponse.success(res, result)
})