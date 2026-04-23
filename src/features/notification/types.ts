export type NotificationType =
    | 'CAMPAIGN_APPROVED'
    | 'CAMPAIGN_REJECTED'
    | 'DONATION_VERIFIED'
    | 'DONATION_REJECTED'
    | 'ITEM_DONATION_VERIFIED'
    | 'PARTICIPANT_APPROVED'
    | 'PARTICIPANT_REJECTED'
    | 'PARTICIPANT_CHECKED_IN'
    | 'CERTIFICATE_SENT'

export interface CreateNotificationInput {
    title: string
    message: string
    type: NotificationType
    recipientUserId?: string
    recipientStudentId?: string
    relatedEntityType?: string
    relatedEntityId?: string
}

export interface NotificationRecipient {
    userId?: string
    studentId?: string
}

export interface NotificationQuery {
    page?: number
    limit?: number
}
