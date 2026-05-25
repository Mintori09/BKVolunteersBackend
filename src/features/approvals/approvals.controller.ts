import { Response, Request } from 'express'
import { EmptyBody, EmptyParams, TypedRequest } from 'src/types/request'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as approvalsService from './approvals.service'
import * as campaignService from 'src/features/campaign/campaign.service'
import { ApprovalQueueQuery } from './types'

const getParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value ?? ''

const getRequestParam = (req: { params?: Record<string, unknown> }, key: string) =>
    getParam(
        req.params?.[key] as string | string[] | undefined
    )

export const getApprovalQueue = catchAsync(
    async (
        req: TypedRequest<EmptyBody, ApprovalQueueQuery, EmptyParams>,
        res: Response
    ) => {
        const result = await approvalsService.getApprovalQueue(
            req.query,
            req.payload
                ? {
                      accountType: req.payload.accountType,
                      role: req.payload.role,
                      organizationId: req.payload.organizationId ?? undefined,
                      facultyId: req.payload.facultyId ?? undefined,
                  }
                : undefined
        )
        return ApiResponse.success(res, result)
    }
)

export const getApprovalQueueItems = catchAsync(
    async (
        req: TypedRequest<EmptyBody, ApprovalQueueQuery, EmptyParams>,
        res: Response
    ) => {
        const result = await approvalsService.getApprovalQueue(
            req.query,
            req.payload
                ? {
                      accountType: req.payload.accountType,
                      role: req.payload.role,
                      organizationId: req.payload.organizationId ?? undefined,
                      facultyId: req.payload.facultyId ?? undefined,
                  }
                : undefined
        )
        return ApiResponse.success(res, result.items)
    }
)

export const getApprovalCampaignDetail = catchAsync(
    async (req: Request, res: Response) => {
        const campaign = await campaignService.getCampaignById(
            getRequestParam(req, 'id'),
            req.payload
        )
        return ApiResponse.success(res, campaign)
    }
)

export const addApprovalComment = catchAsync(
    async (req: Request, res: Response) => {
        const comment = await approvalsService.addApprovalComment(
            getRequestParam(req, 'id'),
            req.body,
            req.payload
        )
        return ApiResponse.success(res, comment, 'Thêm bình luận thành công', 201)
    }
)

export const requestRevision = catchAsync(
    async (req: Request, res: Response) => {
        const result = await campaignService.requestRevision(
            getRequestParam(req, 'id'),
            String(req.body.reason ?? ''),
            req.payload
        )
        return ApiResponse.success(res, result, 'Yêu cầu chỉnh sửa thành công')
    }
)

export const preApproveCampaign = catchAsync(
    async (req: Request, res: Response) => {
        const result = await campaignService.preApproveCampaign(
            getRequestParam(req, 'id'),
            typeof req.body.reason === 'string' ? req.body.reason : undefined,
            req.payload
        )
        return ApiResponse.success(res, result, 'Phê duyệt sơ bộ thành công')
    }
)

export const approveCampaign = catchAsync(
    async (req: Request, res: Response) => {
        const result = await campaignService.approveCampaign(
            getRequestParam(req, 'id'),
            typeof req.body.reason === 'string' ? req.body.reason : undefined,
            req.payload
        )
        return ApiResponse.success(res, result, 'Duyệt chiến dịch thành công')
    }
)

export const rejectCampaign = catchAsync(
    async (req: Request, res: Response) => {
        const result = await campaignService.rejectCampaign(
            getRequestParam(req, 'id'),
            String(req.body.reason ?? ''),
            req.payload
        )
        return ApiResponse.success(res, result, 'Từ chối chiến dịch thành công')
    }
)
