import { Response, Request } from 'express'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import { TypedRequest } from 'src/types/request'
import * as campaignService from './campaign.service'
import {
    CampaignQuery,
    CampaignReviewInput,
    CreateCampaignInput,
    CreateCampaignModuleInput,
    UpdateCampaignInput,
    UpdateCampaignModuleInput,
} from './types'

const getParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value ?? ''

const getRequestParam = (req: { params?: Record<string, unknown> }, key: string) =>
    getParam(
        req.params?.[key] as string | string[] | undefined
    )

export const createCampaign = catchAsync(
    async (req: TypedRequest<CreateCampaignInput>, res: Response) => {
        const campaign = await campaignService.createCampaign(req.body as CreateCampaignInput, req.payload)
        return ApiResponse.success(res, campaign, 'Tạo chiến dịch thành công', 201)
    }
)

export const getCampaigns = catchAsync(
    async (req: TypedRequest<Record<string, never>, CampaignQuery>, res: Response) => {
        const campaigns = await campaignService.getCampaigns(req.query as CampaignQuery, req.payload)
        return ApiResponse.success(res, campaigns)
    }
)

export const getCampaign = catchAsync(async (req: Request, res: Response) => {
    const campaign = await campaignService.getCampaignById(getRequestParam(req, 'id'), req.payload)
    return ApiResponse.success(res, campaign)
})

export const updateCampaign = catchAsync(
    async (req: TypedRequest<UpdateCampaignInput>, res: Response) => {
        const campaign = await campaignService.updateCampaign(
            getRequestParam(req, 'id'),
            req.body as UpdateCampaignInput,
            req.payload
        )
        return ApiResponse.success(res, campaign, 'Cập nhật chiến dịch thành công')
    }
)

export const submitCampaignForReview = catchAsync(
    async (req: Request, res: Response) => {
        const campaign = await campaignService.submitCampaignForReview(getRequestParam(req, 'id'), req.payload)
        return ApiResponse.success(res, campaign, 'Gửi duyệt chiến dịch thành công')
    }
)

export const requestRevision = catchAsync(
    async (req: TypedRequest<CampaignReviewInput>, res: Response) => {
        const campaign = await campaignService.requestRevision(
            getRequestParam(req, 'id'),
            String(req.body.comment ?? ''),
            req.payload
        )
        return ApiResponse.success(res, campaign, 'Yêu cầu chỉnh sửa thành công')
    }
)

export const approveCampaign = catchAsync(
    async (req: TypedRequest<CampaignReviewInput>, res: Response) => {
        const campaign = await campaignService.approveCampaign(
            getRequestParam(req, 'id'),
            typeof req.body.comment === 'string' ? req.body.comment : undefined,
            req.payload
        )
        return ApiResponse.success(res, campaign, 'Duyệt chiến dịch thành công')
    }
)

export const publishCampaign = catchAsync(
    async (req: Request, res: Response) => {
        const campaign = await campaignService.publishCampaign(getRequestParam(req, 'id'), req.payload)
        return ApiResponse.success(res, campaign, 'Publish chiến dịch thành công')
    }
)

export const endCampaign = catchAsync(async (req: Request, res: Response) => {
    const campaign = await campaignService.endCampaign(getRequestParam(req, 'id'), req.payload)
    return ApiResponse.success(res, campaign, 'Kết thúc chiến dịch thành công')
})

export const createCampaignModule = catchAsync(
    async (req: TypedRequest<CreateCampaignModuleInput>, res: Response) => {
        const module = await campaignService.createCampaignModule(
            getRequestParam(req, 'id'),
            req.body as CreateCampaignModuleInput,
            req.payload
        )
        return ApiResponse.success(res, module, 'Tạo module thành công', 201)
    }
)

export const updateCampaignModule = catchAsync(
    async (req: TypedRequest<UpdateCampaignModuleInput>, res: Response) => {
        const module = await campaignService.updateCampaignModule(
            getRequestParam(req, 'id'),
            getRequestParam(req, 'moduleId'),
            req.body as UpdateCampaignModuleInput,
            req.payload
        )
        return ApiResponse.success(res, module, 'Cập nhật module thành công')
    }
)
