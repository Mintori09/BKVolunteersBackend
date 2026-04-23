import { Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiResponse } from 'src/utils/ApiResponse'
import { ApiError } from 'src/utils/ApiError'
import * as itemPhaseService from './item-phase.service'
import { CreateItemPhaseInput, UpdateItemPhaseInput } from './types'

const getParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0]
    return param ?? ''
}

export const createItemPhase = catchAsync(
    async (req: Request, res: Response) => {
        const userId = req.payload?.userId as string | undefined
        const campaignId = getParam(req.params.campaignId)

        if (!userId) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chưa xác thực người dùng'
            )
        }

        const body = req.body as CreateItemPhaseInput

        const itemPhase = await itemPhaseService.createItemPhase(
            campaignId,
            userId,
            body
        )

        const responseData = {
            ...itemPhase,
            acceptedItems: JSON.parse(itemPhase.acceptedItems),
        }

        return ApiResponse.success(
            res,
            responseData,
            'Tạo giai đoạn quyên góp hiện vật thành công',
            HttpStatus.CREATED
        )
    }
)

export const updateItemPhase = catchAsync(
    async (req: Request, res: Response) => {
        const userId = req.payload?.userId as string | undefined
        const campaignId = getParam(req.params.campaignId)
        const phaseId = getParam(req.params.phaseId)

        if (!userId) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chưa xác thực người dùng'
            )
        }

        const body = req.body as UpdateItemPhaseInput

        const itemPhase = await itemPhaseService.updateItemPhase(
            campaignId,
            parseInt(phaseId),
            userId,
            body
        )

        const responseData = {
            ...itemPhase,
            acceptedItems: JSON.parse(itemPhase.acceptedItems),
        }

        return ApiResponse.success(res, responseData, 'Cập nhật thành công')
    }
)

export const getItemPhaseByCampaignId = catchAsync(
    async (req: Request, res: Response) => {
        const campaignId = getParam(req.params.campaignId)
        const itemPhase =
            await itemPhaseService.getItemPhaseByCampaignId(campaignId)

        const responseData = {
            ...itemPhase,
            acceptedItems: JSON.parse(itemPhase.acceptedItems),
        }

        return ApiResponse.success(res, responseData)
    }
)

export const deleteItemPhase = catchAsync(
    async (req: Request, res: Response) => {
        const userId = req.payload?.userId as string | undefined
        const campaignId = getParam(req.params.campaignId)
        const phaseId = getParam(req.params.phaseId)

        if (!userId) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chưa xác thực người dùng'
            )
        }

        await itemPhaseService.deleteItemPhase(
            campaignId,
            parseInt(phaseId),
            userId
        )

        return res.status(HttpStatus.NO_CONTENT).send()
    }
)
