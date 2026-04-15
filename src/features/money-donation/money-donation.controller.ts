import { Response, Request } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import { TypedRequest } from 'src/types/request'
import * as moneyDonationService from './money-donation.service'
import {
    CreateMoneyPhaseInput,
    UpdateMoneyPhaseInput,
    UserRole,
} from './money-donation.types'

export const createMoneyPhase = catchAsync(
    async (req: TypedRequest<CreateMoneyPhaseInput>, res: Response) => {
        const campaignId = req.params.campaignId as string
        const userId = req.payload?.userId
        const userRole = req.payload?.role as UserRole

        if (!userId) {
            return ApiResponse.error(
                res,
                'Chưa xác thực người dùng',
                HttpStatus.UNAUTHORIZED
            )
        }

        const moneyPhase = await moneyDonationService.createMoneyPhase(
            campaignId,
            req.body as CreateMoneyPhaseInput,
            userId,
            userRole
        )

        return ApiResponse.success(
            res,
            moneyPhase,
            'Tạo giai đoạn quyên góp tiền thành công',
            HttpStatus.CREATED
        )
    }
)

export const getMoneyPhase = catchAsync(async (req: Request, res: Response) => {
    const phaseId = parseInt(req.params.phaseId as string)

    const moneyPhase = await moneyDonationService.getMoneyPhaseById(phaseId)

    return ApiResponse.success(res, moneyPhase)
})

export const updateMoneyPhase = catchAsync(
    async (req: TypedRequest<UpdateMoneyPhaseInput>, res: Response) => {
        const phaseId = parseInt(req.params.phaseId as string)
        const userId = req.payload?.userId
        const userRole = req.payload?.role as UserRole

        if (!userId) {
            return ApiResponse.error(
                res,
                'Chưa xác thực người dùng',
                HttpStatus.UNAUTHORIZED
            )
        }

        const moneyPhase = await moneyDonationService.updateMoneyPhase(
            phaseId,
            req.body as UpdateMoneyPhaseInput,
            userId,
            userRole
        )

        return ApiResponse.success(
            res,
            moneyPhase,
            'Cập nhật giai đoạn quyên góp tiền thành công'
        )
    }
)

export const deleteMoneyPhase = catchAsync(
    async (req: Request, res: Response) => {
        const phaseId = parseInt(req.params.phaseId as string)
        const userId = req.payload?.userId
        const userRole = req.payload?.role as UserRole

        if (!userId) {
            return ApiResponse.error(
                res,
                'Chưa xác thực người dùng',
                HttpStatus.UNAUTHORIZED
            )
        }

        const result = await moneyDonationService.deleteMoneyPhase(
            phaseId,
            userId,
            userRole
        )

        return ApiResponse.success(res, null, result.message)
    }
)

export const getPhaseProgress = catchAsync(
    async (req: Request, res: Response) => {
        const phaseId = parseInt(req.params.phaseId as string)

        const progress = await moneyDonationService.getPhaseProgress(phaseId)

        return ApiResponse.success(res, progress)
    }
)

export const getPhaseDonations = catchAsync(
    async (req: Request, res: Response) => {
        const phaseId = parseInt(req.params.phaseId as string)
        const userId = req.payload?.userId
        const userRole = req.payload?.role as UserRole

        if (!userId) {
            return ApiResponse.error(
                res,
                'Chưa xác thực người dùng',
                HttpStatus.UNAUTHORIZED
            )
        }

        const status = req.query.status as
            | 'PENDING'
            | 'VERIFIED'
            | 'REJECTED'
            | undefined
        const page = req.query.page ? parseInt(req.query.page as string) : 1
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 10

        const result = await moneyDonationService.getPhaseDonations(
            phaseId,
            { status, page, limit },
            userId,
            userRole
        )

        return ApiResponse.success(res, result)
    }
)
