export type NotificationRecord = {
    id: string
    type: string
    title: string
    body: string
    data?: Record<string, unknown>
    read_at: string | null
    created_at: string
}
