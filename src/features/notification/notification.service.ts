import { HttpStatus } from 'src/common/constants'
import * as notificationRepository from './notification.repository'
import { ApiError } from 'src/utils/ApiError'
import {
    CreateNotificationInput,
    NotificationQuery,
    NotificationRecipient,
} from './types'

const ensureRecipient = (recipient: NotificationRecipient) => {
    if (!recipient.userId && !recipient.studentId) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Không xác định được người nhận')
    }
}

const isSameRecipient = (
    recipient: NotificationRecipient,
    notification: {
        recipientUserId?: string | null
        recipientStudentId?: string | null
    }
) => {
    if (recipient.studentId) {
        return notification.recipientStudentId === recipient.studentId
    }

    return notification.recipientUserId === recipient.userId
}

export const createNotification = async (data: CreateNotificationInput) => {
    return notificationRepository.create(data)
}

export const createForUser = async (
    data: Omit<CreateNotificationInput, 'recipientUserId'> & {
        userId: string
    }
) => {
    const { userId, ...rest } = data

    return createNotification({
        ...rest,
        recipientUserId: userId,
    })
}

export const createForStudent = async (
    data: Omit<CreateNotificationInput, 'recipientStudentId'> & {
        studentId: string
    }
) => {
    const { studentId, ...rest } = data

    return createNotification({
        ...rest,
        recipientStudentId: studentId,
    })
}

export const getMyNotifications = async (
    recipient: NotificationRecipient,
    query: NotificationQuery
) => {
    ensureRecipient(recipient)

    return notificationRepository.findMine(recipient, query)
}

export const markAsRead = async (
    id: string,
    recipient: NotificationRecipient
) => {
    ensureRecipient(recipient)

    const notification = await notificationRepository.findById(id)

    if (!notification) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy thông báo')
    }

    if (!isSameRecipient(recipient, notification)) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Bạn không có quyền thao tác thông báo này'
        )
    }

    return notificationRepository.markAsRead(id)
}

export const markAllAsRead = async (recipient: NotificationRecipient) => {
    ensureRecipient(recipient)

    return notificationRepository.markAllAsRead(recipient)
}
