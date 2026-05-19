import { HttpStatus } from 'src/common/constants'
import * as notificationRepository from './notification.repository'
import { ApiError } from 'src/utils/ApiError'
import {
    CreateNotificationInput,
    NotificationQuery,
    NotificationRecipient,
} from './types'

const ensureRecipient = (recipient: NotificationRecipient) => {
    if (!recipient.operatorAccountId && !recipient.studentId) {
        throw new ApiError(
            HttpStatus.UNAUTHORIZED,
            'Không xác định được người nhận'
        )
    }
}

const isSameRecipient = (
    recipient: NotificationRecipient,
    notification: {
        operatorAccountId?: bigint | null
        studentId?: bigint | null
    }
) => {
    if (recipient.studentId) {
        return notification.studentId?.toString() === recipient.studentId
    }

    return (
        notification.operatorAccountId?.toString() ===
        recipient.operatorAccountId
    )
}

export const createNotification = async (data: CreateNotificationInput) => {
    return notificationRepository.create(data)
}

export const createForUser = async (
    data: {
        userId: string
        title: string
        type: CreateNotificationInput['type']
        message?: string
        dataJson?: CreateNotificationInput['dataJson']
        [key: string]: unknown
    }
) => {
    const { userId, message, title, type, dataJson } = data

    return createNotification({
        title,
        type,
        dataJson: dataJson ?? null,
        accountType: 'OPERATOR',
        operatorAccountId: userId,
        body: message ?? title,
    })
}

export const createForStudent = async (
    data: {
        studentId: string
        title: string
        type: CreateNotificationInput['type']
        message?: string
        dataJson?: CreateNotificationInput['dataJson']
        [key: string]: unknown
    }
) => {
    const { studentId, message, title, type, dataJson } = data

    return createNotification({
        title,
        type,
        dataJson: dataJson ?? null,
        accountType: 'STUDENT',
        studentId,
        body: message ?? title,
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
