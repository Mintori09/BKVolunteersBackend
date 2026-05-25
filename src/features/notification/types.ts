export type NotificationType =
    | 'CAMPAIGN_APPROVED'
    | 'CAMPAIGN_REJECTED'
    | 'CAMPAIGN_REVISION_REQUESTED'
    | 'CAMPAIGN_PUBLISHED'
    | 'DONATION_VERIFIED'
    | 'DONATION_REJECTED'
    | 'DONATION_MATCHED'
    | 'ITEM_DONATION_VERIFIED'
    | 'ITEM_PLEDGE_CONFIRMED'
    | 'ITEM_PLEDGE_REJECTED'
    | 'ITEM_PLEDGE_RECEIVED'
    | 'PARTICIPANT_APPROVED'
    | 'PARTICIPANT_REJECTED'
    | 'PARTICIPANT_CHECKED_IN'
    | 'PARTICIPANT_COMPLETED'
    | 'CERTIFICATE_SENT'
    | 'CERTIFICATE_READY'
    | 'CERTIFICATE_REVOKED'
    | 'EVENT_REGISTRATION_OPEN'
    | 'EVENT_COMPLETED'

export interface CreateNotificationInput {
    title: string
    body: string
    type: NotificationType
    accountType: 'STUDENT' | 'OPERATOR'
    operatorAccountId?: string
    studentId?: string
    dataJson?: Record<string, unknown> | null
}

export interface NotificationRecipient {
    accountType: 'STUDENT' | 'OPERATOR'
    operatorAccountId?: string
    studentId?: string
}

export interface NotificationQuery {
    page?: number
    limit?: number
}
