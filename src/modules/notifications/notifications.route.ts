import { Router } from 'express'
import { prismaClient } from 'src/config'
import { requireAuth } from 'src/common/middleware'
import { ApiResponse } from 'src/utils/ApiResponse'

const notificationsRouter = Router()

const getPositiveIntQuery = (value: unknown, fallback: number, max?: number) => {
    const parsed = Number(value ?? fallback)
    const normalized = Number.isFinite(parsed) ? Math.floor(parsed) : fallback
    const positive = Math.max(1, normalized)
    return max ? Math.min(max, positive) : positive
}

const parseBigIntParam = (value: unknown) => {
    if (value == null) return null
    const raw = Array.isArray(value) ? value[0] : String(value)
    if (!/^\d+$/.test(raw)) return null
    return BigInt(raw)
}

const toId = (id: bigint | number | string | null | undefined) =>
    id == null ? null : String(id)

const getNotificationScope = (payload: Express.Request['payload']) => {
    if (!payload?.accountType || !payload?.userId) {
        return null
    }

    if (payload.accountType === 'STUDENT') {
        return {
            accountType: 'STUDENT' as const,
            studentId: BigInt(payload.userId),
            operatorAccountId: undefined,
        }
    }

    return {
        accountType: 'OPERATOR' as const,
        operatorAccountId: BigInt(payload.userId),
        studentId: undefined,
    }
}

notificationsRouter.use(requireAuth)

notificationsRouter.get('/', async (req, res, next) => {
    try {
        const scope = getNotificationScope(req.payload)
        if (!scope) {
            return ApiResponse.error(
                res,
                'Access token payload is invalid',
                401,
                undefined,
                'AUTH_INVALID_ACCESS_TOKEN'
            )
        }

        const page = getPositiveIntQuery(req.query.page, 1)
        const limit = getPositiveIntQuery(req.query.limit, 10, 100)
        const readQuery = String(req.query.read ?? '').trim().toLowerCase()

        const where = {
            accountType: scope.accountType,
            ...(scope.studentId !== undefined && { studentId: scope.studentId }),
            ...(scope.operatorAccountId !== undefined && {
                operatorAccountId: scope.operatorAccountId,
            }),
            ...(readQuery === 'true' && { readAt: { not: null } }),
            ...(readQuery === 'false' && { readAt: null }),
        }

        const [total, unreadCount, items] = await Promise.all([
            prismaClient.notification.count({ where }),
            prismaClient.notification.count({
                where: {
                    accountType: scope.accountType,
                    ...(scope.studentId !== undefined && { studentId: scope.studentId }),
                    ...(scope.operatorAccountId !== undefined && {
                        operatorAccountId: scope.operatorAccountId,
                    }),
                    readAt: null,
                },
            }),
            prismaClient.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ])

        return ApiResponse.success(
            res,
            items.map((item) => ({
                id: toId(item.id),
                type: item.type,
                title: item.title,
                body: item.body,
                data: item.dataJson,
                read_at: item.readAt,
                created_at: item.createdAt,
            })),
            'Notifications fetched successfully',
            200,
            {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
                unread_count: unreadCount,
            }
        )
    } catch (error) {
        next(error)
    }
})

notificationsRouter.patch('/:id/read', async (req, res, next) => {
    try {
        const scope = getNotificationScope(req.payload)
        if (!scope) {
            return ApiResponse.error(
                res,
                'Access token payload is invalid',
                401,
                undefined,
                'AUTH_INVALID_ACCESS_TOKEN'
            )
        }

        const notificationId = parseBigIntParam(req.params.id)
        if (!notificationId) {
            return ApiResponse.error(
                res,
                'notification id must be a positive integer',
                400,
                undefined,
                'NOTIFICATION_INVALID_ID'
            )
        }

        const current = await prismaClient.notification.findFirst({
            where: {
                id: notificationId,
                accountType: scope.accountType,
                ...(scope.studentId !== undefined && { studentId: scope.studentId }),
                ...(scope.operatorAccountId !== undefined && {
                    operatorAccountId: scope.operatorAccountId,
                }),
            },
        })

        if (!current) {
            return ApiResponse.error(
                res,
                'Notification not found',
                404,
                undefined,
                'NOTIFICATION_NOT_FOUND'
            )
        }

        const updated = await prismaClient.notification.update({
            where: { id: current.id },
            data: {
                readAt: current.readAt ?? new Date(),
            },
        })

        return ApiResponse.success(
            res,
            {
                id: toId(updated.id),
                read_at: updated.readAt,
            },
            'Notification marked as read'
        )
    } catch (error) {
        next(error)
    }
})

notificationsRouter.patch('/read-all', async (req, res, next) => {
    try {
        const scope = getNotificationScope(req.payload)
        if (!scope) {
            return ApiResponse.error(
                res,
                'Access token payload is invalid',
                401,
                undefined,
                'AUTH_INVALID_ACCESS_TOKEN'
            )
        }

        const result = await prismaClient.notification.updateMany({
            where: {
                accountType: scope.accountType,
                ...(scope.studentId !== undefined && { studentId: scope.studentId }),
                ...(scope.operatorAccountId !== undefined && {
                    operatorAccountId: scope.operatorAccountId,
                }),
                readAt: null,
            },
            data: {
                readAt: new Date(),
            },
        })

        return ApiResponse.success(
            res,
            {
                updated_count: result.count,
            },
            'All notifications marked as read'
        )
    } catch (error) {
        next(error)
    }
})

export default notificationsRouter
