import { Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as catalogService from 'src/features/catalog/catalog.service'
import * as campaignsService from './campaigns.service'

const parseListQuery = (req: Request) => ({
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    status: typeof req.query.status === 'string' ? req.query.status : undefined,
    module_type:
        typeof req.query.module_type === 'string' ? req.query.module_type : undefined,
    page: typeof req.query.page === 'string' ? Number(req.query.page) : undefined,
    limit: typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined,
})

export const listCampaigns = catchAsync(async (req: Request, res: Response) => {
    const data = campaignsService.listManagedCampaigns(parseListQuery(req))

    return ApiResponse.success(res, data, 'Lay danh sach chien dich thanh cong')
})

export const getCampaignDetail = catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id ?? '')
    const data = campaignsService.getManagedCampaignById(id)

    if (!data) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay chien dich')
    }

    return ApiResponse.success(res, data, 'Lay chi tiet chien dich thanh cong')
})

export const getCampaignPreview = catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id ?? '')
    const data = campaignsService.getManagedCampaignById(id)

    if (!data) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay ban xem truoc chien dich')
    }

    return ApiResponse.success(res, data, 'Lay ban xem truoc chien dich thanh cong')
})

export const createCampaign = catchAsync(async (req: Request, res: Response) => {
    const data = campaignsService.createManagedCampaign({
        title: String(req.body?.title ?? '').trim(),
        summary: String(req.body?.summary ?? '').trim(),
        description:
            typeof req.body?.description === 'string' ? req.body.description : undefined,
        scope_type:
            req.body?.scope_type === 'FACULTY' ||
            req.body?.scope_type === 'SCHOOL' ||
            req.body?.scope_type === 'PUBLIC'
                ? req.body.scope_type
                : 'PUBLIC',
        start_at: String(req.body?.start_at ?? ''),
        end_at: String(req.body?.end_at ?? ''),
    })

    return ApiResponse.success(
        res,
        data,
        'Tao chien dich thanh cong',
        HttpStatus.CREATED
    )
})

export const createModule = catchAsync(async (req: Request, res: Response) => {
    const campaignId = String(req.params.id ?? '')
    const type = String(req.body?.type ?? '')
    if (!['fundraising', 'item_donation', 'event'].includes(type)) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Loai hang muc khong hop le')
    }

    const data = campaignsService.createCampaignModule(campaignId, {
        type: type as 'fundraising' | 'item_donation' | 'event',
        title: String(req.body?.title ?? '').trim(),
        description:
            typeof req.body?.description === 'string' ? req.body.description : undefined,
        start_at: String(req.body?.start_at ?? ''),
        end_at: String(req.body?.end_at ?? ''),
        settings:
            req.body?.settings && typeof req.body.settings === 'object'
                ? { ...req.body.settings }
                : {},
    })

    if (!data) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay chien dich')
    }

    return ApiResponse.success(
        res,
        data,
        'Tao hang muc chien dich thanh cong',
        HttpStatus.CREATED
    )
})

export const submitCampaign = catchAsync(async (req: Request, res: Response) => {
    const campaignId = String(req.params.id ?? '')
    const data = campaignsService.submitCampaignReview(campaignId)

    if (!data) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay chien dich')
    }

    return ApiResponse.success(res, data, 'Gui duyet chien dich thanh cong')
})

export const publishManagedCampaign = catchAsync(
    async (req: Request, res: Response) => {
        const campaignId = String(req.params.id ?? '')
        const actorRole = req.payload?.role

        if (!actorRole) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chua xac thuc nguoi dung')
        }

        const data = campaignsService.publishCampaign(campaignId, actorRole)

        if (!data) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay chien dich')
        }

        return ApiResponse.success(res, data, 'Cong khai chien dich thanh cong')
    }
)

export const deleteManagedCampaign = catchAsync(
    async (req: Request, res: Response) => {
        const campaignId = String(req.params.id ?? '')
        const deleted = campaignsService.deleteCampaign(campaignId)

        if (!deleted) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay chien dich')
        }

        return ApiResponse.success(res, undefined, 'Xoa chien dich thanh cong')
    }
)
