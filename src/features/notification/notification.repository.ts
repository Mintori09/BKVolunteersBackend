import { prismaClient } from 'src/config'
import {
    CreateNotificationInput,
    NotificationQuery,
    NotificationRecipient,
} from './types'

export const create = async (data: CreateNotificationInput) => {
    return prismaClient.notification.create({
        data,
    })
}

export const findMine = async (
    recipient: NotificationRecipient,
    query: NotificationQuery
) => {
    const page = Math.max(query.page || 1, 1)
    const limit = Math.max(query.limit || 10, 1)
    const skip = (page - 1) * limit

    const where = recipient.studentId
        ? { recipientStudentId: recipient.studentId }
        : { recipientUserId: recipient.userId }

    const [items, total] = await Promise.all([
        prismaClient.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prismaClient.notification.count({ where }),
    ])

    return {
        items,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    }
}

export const findById = async (id: string) => {
    return prismaClient.notification.findUnique({
        where: { id },
    })
}

export const markAsRead = async (id: string) => {
    return prismaClient.notification.update({
        where: { id },
        data: { isRead: true },
    })
}

export const markAllAsRead = async (recipient: NotificationRecipient) => {
    const where = recipient.studentId
        ? { recipientStudentId: recipient.studentId, isRead: false }
        : { recipientUserId: recipient.userId, isRead: false }

    return prismaClient.notification.updateMany({
        where,
        data: { isRead: true },
    })
}
