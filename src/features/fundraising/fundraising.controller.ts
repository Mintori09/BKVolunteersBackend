import { Response } from 'express'
import { EmptyBody, EmptyQuery, TypedRequest } from 'src/types/request'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as fundraisingService from './fundraising.service'
import {
    AttachFundraisingTransactionBody,
    CreateFundraisingDonationBody,
    FundraisingDecisionBody,
    FundraisingDonationListQuery,
    FundraisingModuleConfigBody,
    FundraisingDonationParams,
    FundraisingModuleParams,
    FundraisingTransactionListQuery,
    FundraisingTransactionParams,
    SepayWebhookBody,
} from './types'
import { HttpStatus } from 'src/common/constants'

export const getModule = catchAsync(
    async (
        req: TypedRequest<EmptyBody, EmptyQuery, FundraisingModuleParams>,
        res: Response
    ) => {
        const result = await fundraisingService.getModule(req.params.moduleId!)
        return ApiResponse.success(res, result)
    }
)

export const updateModuleConfig = catchAsync(
    async (
        req: TypedRequest<
            FundraisingModuleConfigBody,
            EmptyQuery,
            FundraisingModuleParams
        >,
        res: Response
    ) => {
        const result = await fundraisingService.updateModuleConfig(
            req.params.moduleId!,
            req.body as FundraisingModuleConfigBody,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const createDonation = catchAsync(
    async (
        req: TypedRequest<
            CreateFundraisingDonationBody,
            EmptyQuery,
            FundraisingModuleParams
        >,
        res: Response
    ) => {
        const result = await fundraisingService.createDonation(
            req.params.moduleId!,
            req.body as CreateFundraisingDonationBody,
            req.payload
        )
        return ApiResponse.success(
            res,
            result,
            'Tạo donation thành công',
            HttpStatus.CREATED
        )
    }
)

export const listDonations = catchAsync(
    async (
        req: TypedRequest<
            EmptyBody,
            FundraisingDonationListQuery,
            FundraisingModuleParams
        >,
        res: Response
    ) => {
        const result = await fundraisingService.listDonations(
            req.params.moduleId!,
            req.query,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const listTransactions = catchAsync(
    async (
        req: TypedRequest<EmptyBody, FundraisingTransactionListQuery>,
        res: Response
    ) => {
        const result = await fundraisingService.listTransactions(
            req.query,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const verifyDonation = catchAsync(
    async (
        req: TypedRequest<
            FundraisingDecisionBody,
            EmptyQuery,
            FundraisingDonationParams
        >,
        res: Response
    ) => {
        const result = await fundraisingService.verifyDonation(
            req.params.id!,
            req.body as FundraisingDecisionBody,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const rejectDonation = catchAsync(
    async (
        req: TypedRequest<
            FundraisingDecisionBody,
            EmptyQuery,
            FundraisingDonationParams
        >,
        res: Response
    ) => {
        const result = await fundraisingService.rejectDonation(
            req.params.id!,
            req.body as FundraisingDecisionBody,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const attachTransactionToDonation = catchAsync(
    async (
        req: TypedRequest<
            AttachFundraisingTransactionBody,
            EmptyQuery,
            FundraisingTransactionParams
        >,
        res: Response
    ) => {
        const result = await fundraisingService.attachTransactionToDonation(
            req.params.id!,
            req.body as AttachFundraisingTransactionBody,
            req.payload
        )
        return ApiResponse.success(res, result, 'Gắn transaction thành công')
    }
)

export const unmatchTransaction = catchAsync(
    async (
        req: TypedRequest<EmptyBody, EmptyQuery, FundraisingTransactionParams>,
        res: Response
    ) => {
        const result = await fundraisingService.unmatchTransaction(
            req.params.id!,
            req.payload
        )
        return ApiResponse.success(res, result, 'Gỡ đối soát transaction thành công')
    }
)

export const handleSepayWebhook = catchAsync(
    async (
        req: TypedRequest<SepayWebhookBody, EmptyQuery, Record<string, unknown>>,
        res: Response
    ) => {
        const result = await fundraisingService.handleSepayWebhook(
            req.body as SepayWebhookBody,
            {
                secret:
                    typeof req.headers['x-sepay-secret'] === 'string'
                        ? req.headers['x-sepay-secret']
                        : undefined,
            }
        )
        return ApiResponse.success(res, result)
    }
)
