import { Response, Request } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import { TypedRequest } from 'src/types/request'
import * as campaignService from './campaign.service'
import { CreateCampaignInput, UpdateCampaignInput, UserRole } from './types'

export const createCampaign = catchAsync(
    async (req: TypedRequest<CreateCampaignInput>, res: Response) => {
        const userId = req.payload?.userId
        const userRole = req.payload?.role as UserRole
        const userFacultyId = req.payload?.facultyId

        if (!userId) {
            return ApiResponse.error(
                res,
                'Chưa xác thực người dùng',
                HttpStatus.UNAUTHORIZED
            )
        }

        const campaign = await campaignService.createCampaign(
            req.body as CreateCampaignInput,
            userId,
            userRole,
            userFacultyId
        )

        return ApiResponse.success(
            res,
            campaign,
            'Tạo chiến dịch thành công',
            HttpStatus.CREATED
        )
    }
)

export const getCampaign = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string

    const campaign = await campaignService.getCampaignById(id)

    return ApiResponse.success(res, campaign)
})

export const updateCampaign = catchAsync(
    async (req: TypedRequest<UpdateCampaignInput>, res: Response) => {
        const id = req.params.id as string
        const userId = req.payload?.userId
        const userRole = req.payload?.role as UserRole

        if (!userId) {
            return ApiResponse.error(
                res,
                'Chưa xác thực người dùng',
                HttpStatus.UNAUTHORIZED
            )
        }

        const campaign = await campaignService.updateCampaign(
            id,
            req.body as UpdateCampaignInput,
            userId,
            userRole
        )

        return ApiResponse.success(res, campaign, 'Cập nhật chiến dịch thành công')
    }
)

export const deleteCampaign = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const userId = req.payload?.userId
    const userRole = req.payload?.role as UserRole

    if (!userId) {
        return ApiResponse.error(
            res,
            'Chưa xác thực người dùng',
            HttpStatus.UNAUTHORIZED
        )
    }

    await campaignService.deleteCampaign(id, userId, userRole)

    return ApiResponse.success(res, null, 'Xóa chiến dịch thành công')
})

export const submitCampaign = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const userId = req.payload?.userId
    const userRole = req.payload?.role as UserRole

    if (!userId) {
        return ApiResponse.error(
            res,
            'Chưa xác thực người dùng',
            HttpStatus.UNAUTHORIZED
        )
    }

    const campaign = await campaignService.submitCampaign(id, userId, userRole)

    return ApiResponse.success(
        res,
        campaign,
        'Gửi phê duyệt chiến dịch thành công'
    )
})

export const approveCampaign = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const userId = req.payload?.userId
    const userRole = req.payload?.role as UserRole
    const comment = req.body?.comment as string | undefined

    if (!userId) {
        return ApiResponse.error(
            res,
            'Chưa xác thực người dùng',
            HttpStatus.UNAUTHORIZED
        )
    }

    const campaign = await campaignService.approveCampaign(
        id,
        userId,
        userRole,
        comment
    )

    return ApiResponse.success(res, campaign, 'Phê duyệt chiến dịch thành công')
})

export const rejectCampaign = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const userId = req.payload?.userId
    const userRole = req.payload?.role as UserRole
    const comment = req.body?.comment as string

    if (!userId) {
        return ApiResponse.error(
            res,
            'Chưa xác thực người dùng',
            HttpStatus.UNAUTHORIZED
        )
    }

    const campaign = await campaignService.rejectCampaign(
        id,
        userId,
        userRole,
        comment
    )

    return ApiResponse.success(res, campaign, 'Từ chối chiến dịch thành công')
})

export const completeCampaign = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const userId = req.payload?.userId
    const userRole = req.payload?.role as UserRole
    const eventPhotos = req.body?.eventPhotos as string[] | undefined

    if (!userId) {
        return ApiResponse.error(
            res,
            'Chưa xác thực người dùng',
            HttpStatus.UNAUTHORIZED
        )
    }

    const campaign = await campaignService.completeCampaign(
        id,
        userId,
        userRole,
        eventPhotos
    )

    return ApiResponse.success(
        res,
        campaign,
        'Đánh dấu hoàn thành chiến dịch thành công'
    )
})

export const cancelCampaign = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const userId = req.payload?.userId
    const userRole = req.payload?.role as UserRole

    if (!userId) {
        return ApiResponse.error(
            res,
            'Chưa xác thực người dùng',
            HttpStatus.UNAUTHORIZED
        )
    }

    const campaign = await campaignService.cancelCampaign(id, userId, userRole)

    return ApiResponse.success(res, campaign, 'Hủy chiến dịch thành công')
})

export const uploadPlanFile = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const userId = req.payload?.userId
    const userRole = req.payload?.role as UserRole
    const planFileUrl = req.body?.planFileUrl as string

    if (!userId) {
        return ApiResponse.error(
            res,
            'Chưa xác thực người dùng',
            HttpStatus.UNAUTHORIZED
        )
    }

    const campaign = await campaignService.uploadPlanFile(
        id,
        planFileUrl,
        userId,
        userRole
    )

    return ApiResponse.success(res, campaign, 'Upload file kế hoạch thành công')
})

export const uploadBudgetFile = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string
    const userId = req.payload?.userId
    const userRole = req.payload?.role as UserRole
    const budgetFileUrl = req.body?.budgetFileUrl as string

    if (!userId) {
        return ApiResponse.error(
            res,
            'Chưa xác thực người dùng',
            HttpStatus.UNAUTHORIZED
        )
    }

    const campaign = await campaignService.uploadBudgetFile(
        id,
        budgetFileUrl,
        userId,
        userRole
    )

    return ApiResponse.success(
        res,
        campaign,
        'Upload file dự trù ngân sách thành công'
    )
})

export const getCampaigns = catchAsync(async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined
    const scope = req.query.scope as string | undefined
    const facultyId = req.query.facultyId as string | undefined
    const creatorId = req.query.creatorId as string | undefined
    const page = req.query.page ? parseInt(req.query.page as string) : undefined
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined

    const result = await campaignService.getCampaigns({
        status: status as any,
        scope: scope as any,
        facultyId,
        creatorId,
        page,
        limit,
    })

    return ApiResponse.success(res, result)
})

export const getAvailableCampaigns = catchAsync(async (req: Request, res: Response) => {
    const userRole = req.payload?.role as UserRole
    const userFacultyId = req.payload?.facultyId
    const page = req.query.page ? parseInt(req.query.page as string) : 1
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10

    const result = await campaignService.getAvailableCampaigns(
        userRole,
        userFacultyId,
        page,
        limit
    )

    return ApiResponse.success(res, result)
})
