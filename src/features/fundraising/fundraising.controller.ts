import { Response } from 'express'
import { EmptyBody, EmptyParams, EmptyQuery, TypedRequest } from 'src/types/request'
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
    SepayApiSyncAccountsQuery,
    SepayApiSyncTransactionsBody,
    SepayApiSyncVirtualAccountsBody,
    SepayCreateOrderVaBody,
    SepayOperationRequestBody,
    SepayOperationRequestDecisionBody,
    SepayOperationRequestQuery,
    SepayWebhookBody,
    SepayWebhookHeaders,
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

export const getDonation = catchAsync(
    async (
        req: TypedRequest<EmptyBody, EmptyQuery, FundraisingDonationParams>,
        res: Response
    ) => {
        const result = await fundraisingService.getDonation(
            req.params.id!,
            req.payload
        )

        return ApiResponse.success(res, result)
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

export const exportDonations = catchAsync(
    async (
        req: TypedRequest<
            EmptyBody,
            EmptyQuery,
            FundraisingModuleParams
        >,
        res: Response
    ) => {
        const csvData = await fundraisingService.exportDonationsAsCsv(
            req.params.moduleId!,
            req.payload
        )
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        res.setHeader('Content-Disposition', `attachment; filename="donations_${req.params.moduleId}.csv"`)
        
        // Add BOM for Excel UTF-8 support
        res.send('\uFEFF' + csvData)
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
            ({
                secret:
                    typeof req.headers['x-sepay-secret'] === 'string'
                        ? req.headers['x-sepay-secret']
                        : undefined,
                signature:
                    typeof req.headers['x-sepay-signature'] === 'string'
                        ? req.headers['x-sepay-signature']
                        : undefined,
                timestamp:
                    typeof req.headers['x-sepay-timestamp'] === 'string'
                        ? req.headers['x-sepay-timestamp']
                        : undefined,
                rawBody: req.rawBody,
            } satisfies SepayWebhookHeaders)
        )
        return ApiResponse.success(res, result)
    }
)

export const listSepayAccounts = catchAsync(
    async (
        req: TypedRequest<EmptyBody, SepayApiSyncAccountsQuery, EmptyParams>,
        res: Response
    ) => {
        const result = await fundraisingService.listSepayAccounts(
            req.query,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const syncSepayAccounts = catchAsync(
    async (
        req: TypedRequest<EmptyBody, SepayApiSyncAccountsQuery, EmptyParams>,
        res: Response
    ) => {
        const result = await fundraisingService.syncSepayAccounts(
            req.query,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const getSepaySyncStatus = catchAsync(async (req, res: Response) => {
    const result = await fundraisingService.getSepaySyncStatus(req.payload)
    return ApiResponse.success(res, result)
})

export const syncSepayTransactions = catchAsync(
    async (
        req: TypedRequest<SepayApiSyncTransactionsBody>,
        res: Response
    ) => {
        const result = await fundraisingService.syncSepayTransactions(
            req.body as SepayApiSyncTransactionsBody,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const listSepayUnmatchedTransactions = catchAsync(
    async (req, res: Response) => {
        const result = await fundraisingService.listSepayUnmatchedTransactions(
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const syncSepayVirtualAccounts = catchAsync(
    async (
        req: TypedRequest<SepayApiSyncVirtualAccountsBody>,
        res: Response
    ) => {
        const result = await fundraisingService.syncSepayVirtualAccounts(
            req.body as SepayApiSyncVirtualAccountsBody,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const createSepayOrderVa = catchAsync(
    async (
        req: TypedRequest<SepayCreateOrderVaBody>,
        res: Response
    ) => {
        const result = await fundraisingService.createOrderVaForDonation(
            req.body as SepayCreateOrderVaBody,
            req.payload
        )
        return ApiResponse.success(res, result, 'Tạo SePay order/VA thành công')
    }
)

export const createSepayOperationRequest = catchAsync(
    async (
        req: TypedRequest<SepayOperationRequestBody>,
        res: Response
    ) => {
        const result = await fundraisingService.createSepayOperationRequest(
            req.body as SepayOperationRequestBody,
            req.payload
        )
        return ApiResponse.success(
            res,
            result,
            'Đã tạo SePay request',
            HttpStatus.CREATED
        )
    }
)

export const listSepayOperationRequests = catchAsync(
    async (
        req: TypedRequest<EmptyBody, SepayOperationRequestQuery>,
        res: Response
    ) => {
        const result = await fundraisingService.listSepayOperationRequests(
            req.query,
            req.payload
        )
        return ApiResponse.success(res, result)
    }
)

export const approveSepayOperationRequest = catchAsync(
    async (
        req: TypedRequest<
            SepayOperationRequestDecisionBody,
            EmptyQuery,
            FundraisingTransactionParams
        >,
        res: Response
    ) => {
        const result = await fundraisingService.approveSepayOperationRequest(
            req.params.id!,
            req.body as SepayOperationRequestDecisionBody,
            req.payload
        )
        return ApiResponse.success(res, result, 'Đã phê duyệt SePay request')
    }
)

export const rejectSepayOperationRequest = catchAsync(
    async (
        req: TypedRequest<
            SepayOperationRequestDecisionBody,
            EmptyQuery,
            FundraisingTransactionParams
        >,
        res: Response
    ) => {
        const result = await fundraisingService.rejectSepayOperationRequest(
            req.params.id!,
            req.body as SepayOperationRequestDecisionBody,
            req.payload
        )
        return ApiResponse.success(res, result, 'Đã từ chối SePay request')
    }
)
