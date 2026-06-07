import { Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as catalogService from 'src/features/catalog/catalog.service'

export const listPublicCampaigns = catchAsync(
    async (req: Request, res: Response) => {
        const data = await catalogService.listPublicCampaigns({
            q: typeof req.query.q === 'string' ? req.query.q : undefined,
            organization_id:
                typeof req.query.organization_id === 'string'
                    ? req.query.organization_id
                    : undefined,
            module_type:
                typeof req.query.module_type === 'string'
                    ? req.query.module_type
                    : undefined,
            status:
                typeof req.query.status === 'string'
                    ? req.query.status
                    : undefined,
            page:
                typeof req.query.page === 'string'
                    ? Number(req.query.page)
                    : undefined,
            limit:
                typeof req.query.limit === 'string'
                    ? Number(req.query.limit)
                    : undefined,
        })

        return ApiResponse.success(
            res,
            data,
            'Lay danh sach chien dich cong khai thanh cong'
        )
    }
)

export const getPublicCampaignDetail = catchAsync(
    async (req: Request, res: Response) => {
        const slug = String(req.params.slug ?? '')
        const data = await catalogService.getPublicCampaignBySlug(slug)

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay chien dich cong khai'
            )
        }

        return ApiResponse.success(
            res,
            data,
            'Lay chi tiet chien dich cong khai thanh cong'
        )
    }
)
