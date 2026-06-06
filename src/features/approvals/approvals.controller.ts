import { Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import * as catalogService from 'src/features/catalog/catalog.service'
import * as campaignsService from 'src/features/campaigns/campaigns.service'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'

const parseQuery = (req: Request) => ({
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    module_type:
        typeof req.query.module_type === 'string' ? req.query.module_type : undefined,
    limit: typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined,
})

export const listApprovalCampaigns = catchAsync(
    async (req: Request, res: Response) => {
        const data = [
            ...campaignsService.listManagedApprovalQueue(parseQuery(req)),
            ...catalogService.getApprovalQueue(parseQuery(req)),
        ]

        return ApiResponse.success(
            res,
            data,
            'Lay danh sach ho so cho phe duyet thanh cong'
        )
    }
)

export const getApprovalCampaignDetail = catchAsync(
    async (req: Request, res: Response) => {
        const id = String(req.params.id ?? '')
        const data =
            campaignsService.getManagedApprovalCampaignDetail(id) ??
            catalogService.getApprovalCampaignDetail(id)

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay ho so cho phe duyet'
            )
        }

        return ApiResponse.success(
            res,
            data,
            'Lay chi tiet ho so cho phe duyet thanh cong'
        )
    }
)

export const addApprovalComment = catchAsync(
    async (req: Request, res: Response) => {
        const campaignId = String(req.params.id ?? '')
        const body = String(req.body?.body ?? '').trim()

        if (!body) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Noi dung nhan xet la bat buoc')
        }

        const data = campaignsService.addApprovalComment(campaignId, {
            body,
            visibility:
                req.body?.visibility === 'INTERNAL' ? 'INTERNAL' : 'PUBLIC',
            module_id:
                typeof req.body?.module_id === 'string'
                    ? req.body.module_id
                    : undefined,
        })

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay ho so cho phe duyet'
            )
        }

        return ApiResponse.success(res, data, 'Them nhan xet phe duyet thanh cong')
    }
)

export const approvalTransition = catchAsync(
    async (req: Request, res: Response) => {
        const campaignId = String(req.params.id ?? '')
        const action = String(req.params.action ?? '')
        const actorRole = req.payload?.role

        if (!actorRole) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chua xac thuc nguoi dung')
        }

        if (
            !['pre-approve', 'approve', 'request-revision', 'reject'].includes(
                action
            )
        ) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Thao tac phe duyet khong hop le')
        }

        const data = campaignsService.transitionApproval(
            campaignId,
            action as 'pre-approve' | 'approve' | 'request-revision' | 'reject',
            actorRole,
            typeof req.body?.reason === 'string' ? req.body.reason : undefined
        )

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay ho so cho phe duyet'
            )
        }

        return ApiResponse.success(
            res,
            data,
            'Cap nhat trang thai phe duyet thanh cong'
        )
    }
)
