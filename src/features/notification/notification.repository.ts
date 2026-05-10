import { Prisma } from '@prisma/client'
import { prismaClient } from 'src/config'
import {
    CreateNotificationInput,
    NotificationQuery,
    NotificationRecipient,
} from './types'

export const create = async (data: CreateNotificationInput) => {
    return prismaClient.notification.create({
        data: data as Prisma.NotificationUncheckedCreateInput,
    })
}

export const findMine = async (
    recipient: NotificationRecipient,
    query: NotificationQuery
) => {
    const page = Math.max(query.page || 1, 1)
    const limit = Math.max(query.limit || 10, 1)
    const skip = (page - 1) * limit

    const where = recipient.accountType === 'STUDENT'
        ? { accountType: 'STUDENT' as const, studentId: BigInt(recipient.studentId!) }
        : {
              accountType: 'OPERATOR' as const,
              operatorAccountId: BigInt(recipient.operatorAccountId!),
          }

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
        where: { id: BigInt(id) },
    })
}

export const markAsRead = async (id: string) => {
    return prismaClient.notification.update({
        where: { id: BigInt(id) },
        data: { readAt: new Date() },
    })
}

export const markAllAsRead = async (recipient: NotificationRecipient) => {
    const where = recipient.accountType === 'STUDENT'
        ? {
              accountType: 'STUDENT' as const,
              studentId: BigInt(recipient.studentId!),
              readAt: null,
          }
        : {
              accountType: 'OPERATOR' as const,
              operatorAccountId: BigInt(recipient.operatorAccountId!),
              readAt: null,
          }

    return prismaClient.notification.updateMany({
        where,
        data: { readAt: new Date() },
    })
}
