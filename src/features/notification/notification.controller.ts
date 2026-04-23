import { Request, Response } from 'express'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiResponse } from 'src/utils/ApiResponse'
import * as notificationService from './notification.service'
import { NotificationQuery, NotificationRecipient } from './types'

const getRecipient = (req: Request): NotificationRecipient => {
    if (req.payload?.role === 'SINHVIEN') {
        return { studentId: req.payload.userId }
    }

    return { userId: req.payload?.userId }
}

export const getMyNotifications = catchAsync(
    async (req: Request, res: Response) => {
        const query: NotificationQuery = {
            page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        }

        const notifications = await notificationService.getMyNotifications(
            getRecipient(req),
            query
        )

        return ApiResponse.success(res, notifications)
    }
)

export const markAsRead = catchAsync(async (req: Request, res: Response) => {
    const notification = await notificationService.markAsRead(
        req.params.id as string,
        getRecipient(req)
    )

    return ApiResponse.success(res, notification, 'Đánh dấu đã đọc thành công')
})

export const markAllAsRead = catchAsync(
    async (req: Request, res: Response) => {
        const result = await notificationService.markAllAsRead(getRecipient(req))

        return ApiResponse.success(
            res,
            result,
            'Đánh dấu tất cả thông báo đã đọc thành công'
        )
    }
)
