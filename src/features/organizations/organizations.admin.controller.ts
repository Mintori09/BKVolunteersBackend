import { Request, Response } from 'express'
import * as catalogService from 'src/features/catalog/catalog.service'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'

export const listAdminOrganizations = catchAsync(
    async (req: Request, res: Response) => {
        const items = await catalogService.listAdminOrganizations({
            q: typeof req.query.q === 'string' ? req.query.q : undefined,
            type:
                typeof req.query.type === 'string' ? req.query.type : undefined,
            status:
                typeof req.query.status === 'string'
                    ? req.query.status
                    : undefined,
        })

        return ApiResponse.success(
            res,
            { items },
            'Lay danh sach don vi quan tri thanh cong'
        )
    }
)

export const createAdminOrganization = catchAsync(
    async (req: Request, res: Response) => {
        const organization = await catalogService.createAdminOrganization(
            req.body ?? {}
        )

        return ApiResponse.success(
            res,
            organization,
            'Tao don vi thanh cong',
            201
        )
    }
)

export const updateAdminOrganization = catchAsync(
    async (req: Request, res: Response) => {
        const organization = await catalogService.updateAdminOrganization(
            String(req.params.id ?? ''),
            req.body ?? {}
        )

        return ApiResponse.success(
            res,
            organization,
            'Cap nhat don vi thanh cong'
        )
    }
)

export const deleteAdminOrganization = catchAsync(
    async (req: Request, res: Response) => {
        await catalogService.deleteAdminOrganization(
            String(req.params.id ?? '')
        )

        return ApiResponse.success(res, null, 'Xoa don vi thanh cong')
    }
)
