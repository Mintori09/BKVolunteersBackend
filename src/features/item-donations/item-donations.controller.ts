import { Response } from 'express'
import { EmptyBody, EmptyQuery, TypedRequest } from 'src/types/request'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as itemDonationsService from './item-donations.service'
import {
    CreateItemTargetBody,
    CreateItemPledgeBody,
    ItemDonationConfigBody,
    ItemDonationModuleParams,
    ItemDonationPledgeListQuery,
    ItemDonationPledgeParams,
    ItemDonationTargetParams,
    ItemDonationTargetListQuery,
    ItemPledgeHandoverBody,
    RejectItemPledgeBody,
    UpdateItemTargetBody,
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

export const updateModuleConfig = catchAsync(
    async (
        req: TypedRequest<ItemDonationConfigBody, EmptyQuery, ItemDonationModuleParams>,
        res: Response
    ) => {
        const result = await itemDonationsService.updateModuleConfig(
            req.params.moduleId!,
            req.body as ItemDonationConfigBody,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const createTarget = catchAsync(
    async (
        req: TypedRequest<CreateItemTargetBody, EmptyQuery, ItemDonationModuleParams>,
        res: Response
    ) => {
        const result = await itemDonationsService.createTarget(
            req.params.moduleId!,
            req.body as CreateItemTargetBody,
            req.payload
        )
        return ApiResponse.success(res, result, 'Tạo mục tiêu hiện vật thành công', 201)
    }
)

export const getTargets = catchAsync(
    async (
        req: TypedRequest<EmptyBody, ItemDonationTargetListQuery, ItemDonationModuleParams>,
        res: Response
    ) => {
        const result = await itemDonationsService.getTargets(
            req.params.moduleId!,
            req.query
        )
        return ApiResponse.success(res, result)
    }
)

export const updateTarget = catchAsync(
    async (
        req: TypedRequest<UpdateItemTargetBody, EmptyQuery, ItemDonationTargetParams>,
        res: Response
    ) => {
        const result = await itemDonationsService.updateTarget(
            req.params.id!,
            req.body as UpdateItemTargetBody,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const deleteTarget = catchAsync(
    async (
        req: TypedRequest<EmptyBody, EmptyQuery, ItemDonationTargetParams>,
        res: Response
    ) => {
        await itemDonationsService.deleteTarget(req.params.id!, req.payload)
        return res.sendStatus(204)
    }
)

export const getPledges = catchAsync(
    async (
        req: TypedRequest<EmptyBody, ItemDonationPledgeListQuery, ItemDonationModuleParams>,
        res: Response
    ) => {
        const result = await itemDonationsService.getPledges(
            req.params.moduleId!,
            req.query,
            req.payload
        )
        return ApiResponse.success(res, result)
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

export const rejectPledge = catchAsync(
    async (
        req: TypedRequest<RejectItemPledgeBody, EmptyQuery, ItemDonationPledgeParams>,
        res: Response
    ) => {
        const result = await itemDonationsService.rejectPledge(
            req.params.id!,
            req.body as RejectItemPledgeBody,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const handoverPledge = catchAsync(
    async (
        req: TypedRequest<ItemPledgeHandoverBody, EmptyQuery, ItemDonationPledgeParams>,
        res: Response
    ) => {
        const result = await itemDonationsService.handoverPledge(
            req.params.id!,
            req.body as ItemPledgeHandoverBody,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)
