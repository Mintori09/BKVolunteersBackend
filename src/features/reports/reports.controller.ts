import { Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import * as catalogService from 'src/features/catalog/catalog.service'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'

export const getSchoolOverview = catchAsync(
    async (req: Request, res: Response) => {
        const data = await catalogService.getSchoolOverview({
            from:
                typeof req.query.from === 'string' ? req.query.from : undefined,
            to: typeof req.query.to === 'string' ? req.query.to : undefined,
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
        })

        return ApiResponse.success(
            res,
            data,
            'Lay bao cao tong quan thanh cong'
        )
    }
)

export const getCampaignReport = catchAsync(
    async (req: Request, res: Response) => {
        const id = String(req.params.id ?? '')
        const data = await catalogService.getCampaignReport(id)

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay bao cao chien dich'
            )
        }

        return ApiResponse.success(
            res,
            data,
            'Lay bao cao chien dich thanh cong'
        )
    }
)

export const getCampaignReconciliation = catchAsync(
    async (req: Request, res: Response) => {
        const id = String(req.params.id ?? '')
        const data = await catalogService.getCampaignReconciliation(id)

        if (!data) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Khong tim thay bao cao doi soat chien dich'
            )
        }

        return ApiResponse.success(
            res,
            data,
            'Lay bao cao doi soat chien dich thanh cong'
        )
    }
)
