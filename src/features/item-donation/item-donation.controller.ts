import { Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiResponse } from 'src/utils/ApiResponse'
import { ApiError } from 'src/utils/ApiError'
import * as itemDonationService from './item-donation.service'
import { CreateItemDonationInput, VerifyItemDonationInput } from './types'

const getParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0]
    return param ?? ''
}

const getQueryParam = (
    param: string | string[] | undefined
): string | undefined => {
    if (Array.isArray(param)) return param[0]
    return param
}

export const createItemDonation = catchAsync(
    async (req: Request, res: Response) => {
        const studentId = req.payload?.userId as string | undefined

        if (!studentId) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chưa xác thực người dùng'
            )
        }

        const body = req.body as CreateItemDonationInput

        const donation = await itemDonationService.createItemDonation(
            studentId,
            body
        )

        return ApiResponse.success(
            res,
            donation,
            'Ghi nhận đóng góp thành công, chờ xác minh',
            HttpStatus.CREATED
        )
    }
)

export const getItemDonationsByPhase = catchAsync(
    async (req: Request, res: Response) => {
        const userId = req.payload?.userId as string | undefined
        const phaseId = getParam(req.params.phaseId)
        const status = getQueryParam(
            req.query.status as string | string[] | undefined
        )
        const page = getQueryParam(
            req.query.page as string | string[] | undefined
        )
        const limit = getQueryParam(
            req.query.limit as string | string[] | undefined
        )

        if (!userId) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chưa xác thực người dùng'
            )
        }

        const result = await itemDonationService.getItemDonationsByPhase(
            parseInt(phaseId),
            userId,
            {
                status,
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
            }
        )

        return ApiResponse.success(res, result)
    }
)

export const verifyItemDonation = catchAsync(
    async (req: Request, res: Response) => {
        const userId = req.payload?.userId as string | undefined
        const donationId = getParam(req.params.id)

        if (!userId) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chưa xác thực người dùng'
            )
        }

        const donation = await itemDonationService.verifyItemDonation(
            donationId,
            req.body as VerifyItemDonationInput,
            userId
        )

        return ApiResponse.success(
            res,
            donation,
            'Xác thực đóng góp hiện vật thành công'
        )
    }
)
