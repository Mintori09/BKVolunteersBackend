import { initialNotifications } from './notifications.data'
import { NotificationRecord } from './notifications.types'

let notificationStore: NotificationRecord[] = initialNotifications.map((item) => ({
    ...item,
    data: item.data ? { ...item.data } : undefined,
}))

const cloneNotification = (item: NotificationRecord): NotificationRecord => ({
    ...item,
    data: item.data ? { ...item.data } : undefined,
})

export const resetNotificationStore = () => {
    notificationStore = initialNotifications.map(cloneNotification)
}

export const listNotifications = (params: {
    read?: string
    page?: number
    limit?: number
}) => {
    const readFilter = params.read === 'true' ? true : params.read === 'false' ? false : null
    const page = params.page && params.page > 0 ? Math.floor(params.page) : 1
    const limit = params.limit && params.limit > 0 ? Math.min(100, Math.floor(params.limit)) : 20

    const filtered = notificationStore
        .filter((item) => {
            if (readFilter === null) {
                return true
            }

            return readFilter ? Boolean(item.read_at) : !item.read_at
        })
        .sort(
            (left, right) =>
                new Date(right.created_at).getTime() -
                new Date(left.created_at).getTime()
        )

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const start = (page - 1) * limit

    return {
        items: filtered.slice(start, start + limit).map(cloneNotification),
        meta: {
            total,
            page,
            limit,
            totalPages,
        },
    }
}

export const markNotificationRead = (id: string) => {
    const now = new Date().toISOString()
    let updated: NotificationRecord | null = null

    notificationStore = notificationStore.map((item) => {
        if (item.id !== id) {
            return item
        }

        updated = {
            ...item,
            read_at: item.read_at ?? now,
        }

        return updated
    })

    return updated ? cloneNotification(updated) : null
}

export const markAllNotificationsRead = () => {
    const now = new Date().toISOString()
    let count = 0

    notificationStore = notificationStore.map((item) => {
        if (item.read_at) {
            return item
        }

        count += 1
        return {
            ...item,
            read_at: now,
        }
    })

    return { count }
}
