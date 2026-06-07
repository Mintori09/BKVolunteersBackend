import { prismaClient } from 'src/config'

const resolveActor = async (userId: string, role: string) => {
    if (role === 'SINHVIEN') {
        const student = await prismaClient.student.findUnique({
            where: {
                userId,
            },
            select: {
                id: true,
            },
        })

        return student
            ? {
                  type: 'student' as const,
                  id: student.id,
              }
            : null
    }

    const manager = await prismaClient.managerAccount.findUnique({
        where: {
            userId,
        },
        select: {
            id: true,
        },
    })

    return manager
        ? {
              type: 'manager' as const,
              id: manager.id,
          }
        : null
}

const mapNotification = (
    item:
        | Awaited<
              ReturnType<typeof prismaClient.studentNotification.findMany>
          >[number]
        | Awaited<
              ReturnType<typeof prismaClient.managerNotification.findMany>
          >[number]
) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    body: item.message,
    data: item.targetId
        ? {
              target_type: item.targetType,
              target_id: item.targetId,
          }
        : undefined,
    read_at: item.isRead ? item.createdAt.toISOString() : null,
    created_at: item.createdAt.toISOString(),
})

export const resetNotificationStore = async () => {
    await prismaClient.studentNotification.updateMany({
        where: {
            id: 'notification-1',
        },
        data: {
            isRead: false,
        },
    })
}

export const listNotifications = async (params: {
    userId: string
    role: string
    read?: string
    page?: number
    limit?: number
}) => {
    const actor = await resolveActor(params.userId, params.role)
    const readFilter =
        params.read === 'true' ? true : params.read === 'false' ? false : null
    const page = params.page && params.page > 0 ? Math.floor(params.page) : 1
    const limit =
        params.limit && params.limit > 0
            ? Math.min(100, Math.floor(params.limit))
            : 20

    if (!actor) {
        return {
            items: [],
            meta: {
                total: 0,
                page,
                limit,
                totalPages: 1,
            },
        }
    }

    if (actor.type === 'student') {
        const where = {
            studentId: actor.id,
            ...(readFilter === null ? {} : { isRead: readFilter }),
        }
        const [items, total] = await Promise.all([
            prismaClient.studentNotification.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prismaClient.studentNotification.count({
                where,
            }),
        ])

        return {
            items: items.map(mapNotification),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        }
    }

    const where = {
        managerId: actor.id,
        ...(readFilter === null ? {} : { isRead: readFilter }),
    }
    const [items, total] = await Promise.all([
        prismaClient.managerNotification.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prismaClient.managerNotification.count({
            where,
        }),
    ])

    return {
        items: items.map(mapNotification),
        meta: {
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    }
}

export const markNotificationRead = async (
    id: string,
    userId: string,
    role: string
) => {
    const actor = await resolveActor(userId, role)

    if (!actor) {
        return null
    }

    if (actor.type === 'student') {
        const item = await prismaClient.studentNotification.findFirst({
            where: {
                id,
                studentId: actor.id,
            },
        })

        if (!item) {
            return null
        }

        await prismaClient.studentNotification.update({
            where: {
                id,
            },
            data: {
                isRead: true,
            },
        })

        return {
            id,
            read_at: new Date().toISOString(),
        }
    }

    const item = await prismaClient.managerNotification.findFirst({
        where: {
            id,
            managerId: actor.id,
        },
    })

    if (!item) {
        return null
    }

    await prismaClient.managerNotification.update({
        where: {
            id,
        },
        data: {
            isRead: true,
        },
    })

    return {
        id,
        read_at: new Date().toISOString(),
    }
}

export const markAllNotificationsRead = async (
    userId: string,
    role: string
) => {
    const actor = await resolveActor(userId, role)

    if (!actor) {
        return { count: 0 }
    }

    if (actor.type === 'student') {
        const result = await prismaClient.studentNotification.updateMany({
            where: {
                studentId: actor.id,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        })

        return {
            count: result.count,
        }
    }

    const result = await prismaClient.managerNotification.updateMany({
        where: {
            managerId: actor.id,
            isRead: false,
        },
        data: {
            isRead: true,
        },
    })

    return {
        count: result.count,
    }
}
