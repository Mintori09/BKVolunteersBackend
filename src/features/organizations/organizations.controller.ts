import { Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import * as catalogService from 'src/features/catalog/catalog.service'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'

export const listOrganizations = catchAsync(
    async (_req: Request, res: Response) => {
        const data = catalogService.listOrganizations()

        return ApiResponse.success(
            res,
            { items: data },
            'Lay danh sach to chuc thanh cong'
        )
    }
)

export const getOrganizationDetail = catchAsync(
    async (req: Request, res: Response) => {
        const slug = String(req.params.slug ?? '')
        const data = catalogService.getOrganizationBySlug(slug)

        if (!data) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay to chuc')
        }

        return ApiResponse.success(res, data, 'Lay chi tiet to chuc thanh cong')
    }
)
