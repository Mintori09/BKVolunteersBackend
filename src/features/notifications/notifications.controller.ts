import { Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as notificationsService from './notifications.service'

export const getNotificationsPage = catchAsync(
    async (req: Request, res: Response) => {
        const userId = String(req.payload?.userId ?? '')
        const role = String(req.payload?.role ?? '')
        const data = await notificationsService.listNotifications({
            userId,
            role,
            read:
                typeof req.query.read === 'string' ? req.query.read : undefined,
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
            'Lay danh sach thong bao thanh cong'
        )
    }
)

export const markNotificationRead = catchAsync(
    async (req: Request, res: Response) => {
        const id = String(req.params.id ?? '')
        const userId = String(req.payload?.userId ?? '')
        const role = String(req.payload?.role ?? '')
        const data = await notificationsService.markNotificationRead(
            id,
            userId,
            role
        )

        if (!data) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay thong bao')
        }

        return ApiResponse.success(
            res,
            { id: data.id, read_at: data.read_at },
            'Cap nhat trang thai thong bao thanh cong'
        )
    }
)

export const markAllNotificationsRead = catchAsync(
    async (req: Request, res: Response) => {
        const userId = String(req.payload?.userId ?? '')
        const role = String(req.payload?.role ?? '')
        const data = await notificationsService.markAllNotificationsRead(
            userId,
            role
        )

        return ApiResponse.success(
            res,
            data,
            'Da danh dau tat ca thong bao la da doc'
        )
    }
)
