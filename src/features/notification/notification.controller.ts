import { Request, Response } from 'express'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiResponse } from 'src/utils/ApiResponse'
import { serializeId } from 'src/common/serializers'
import * as notificationService from './notification.service'
import { NotificationQuery, NotificationRecipient } from './types'

const getRecipient = (req: Request): NotificationRecipient => {
    if (req.payload?.accountType === 'STUDENT') {
        return { accountType: 'STUDENT', studentId: req.payload.userId }
    }

    return {
        accountType: 'OPERATOR',
        operatorAccountId: req.payload?.userId,
    }
}

const toNotificationItem = (notification: {
    id: bigint
    type: string
    title: string
    body: string
    dataJson?: unknown
    readAt?: Date | null
    createdAt: Date
}) => ({
    id: serializeId(notification.id)!,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.dataJson ?? undefined,
    read_at: notification.readAt?.toISOString() ?? null,
    created_at: notification.createdAt.toISOString(),
})

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

        return ApiResponse.success(res, {
            items: notifications.items.map(toNotificationItem),
            meta: notifications.meta,
        })
    }
)

export const markAsRead = catchAsync(async (req: Request, res: Response) => {
    const notification = await notificationService.markAsRead(
        req.params.id as string,
        getRecipient(req)
    )

    return ApiResponse.success(
        res,
        {
            id: serializeId(notification.id)!,
            read_at: notification.readAt!.toISOString(),
        },
        'Đánh dấu đã đọc thành công'
    )
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
