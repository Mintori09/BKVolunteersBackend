import { Response } from 'express'
import { EmptyBody, EmptyQuery, TypedRequest } from 'src/types/request'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as itemDonationsService from './item-donations.service'
import {
    CreateItemPledgeBody,
    ItemDonationModuleParams,
    ItemDonationPledgeParams,
} from './types'

export const getItemDonationModule = catchAsync(
    async (
        req: TypedRequest<EmptyBody, EmptyQuery, ItemDonationModuleParams>,
        res: Response
    ) => {
        const result = await itemDonationsService.getItemDonationModule(
            req.params.moduleId!
        )
        return ApiResponse.success(res, result)
    }
)

export const createPledge = catchAsync(
    async (
        req: TypedRequest<CreateItemPledgeBody, EmptyQuery, ItemDonationModuleParams>,
        res: Response
    ) => {
        const result = await itemDonationsService.createPledge(
            req.params.moduleId!,
            req.body as CreateItemPledgeBody,
            req.payload
        )
        return ApiResponse.success(res, result, 'Tạo pledge thành công', 201)
    }
)

export const confirmPledge = catchAsync(
    async (
        req: TypedRequest<EmptyBody, EmptyQuery, ItemDonationPledgeParams>,
        res: Response
    ) => {
        const result = await itemDonationsService.confirmPledge(
            req.params.id!,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)
