import { PaginatedResult } from 'src/common/types'

export interface UpdateProfileInput {
    phone?: string
    classCode?: string
    avatarUrl?: string
    major?: string
    year?: number
}

export interface StudentProfile {
    id: string
    studentCode: string
    fullName: string
    email: string
    facultyId: string
    classCode: string | null
    phone: string | null
    avatarUrl: string | null
    major: string | null
    year: number | null
    totalPoints: number
    titles: StudentTitleDetail[]
    createdAt: Date
    updatedAt: Date
}

export interface StudentTitleDetail {
    titleId: string
    name: string
    description: string | null
    minPoints: number
    iconUrl: string | null
    badgeColor: string | null
    unlockedAt: Date | null
}

export interface PointHistoryItem {
    id: string
    points: number
    reason: string
    sourceType: string
    sourceId: string | null
    createdAt: Date
}

export type PointsHistoryOutput = PaginatedResult<PointHistoryItem>

export interface StudentCertificateItem {
    id: string
    certificateNo: string
    campaignId: string
    campaignTitle: string
    moduleTitle: string | null
    templateName: string
    status: string
    fileUrl: string | null
    issuedAt: string | null
    revokedAt: string | null
    createdAt: string
}

export interface StudentActivityItem {
    id: string
    activity_type: 'money_donation' | 'item_pledge' | 'event_registration' | 'certificate'
    reference_id: string
    campaign_id: string | null
    campaign_title: string
    campaign_slug: string
    module_id: string | null
    module_title: string
    module_type: string | null
    status: string
    occurred_at: string
    summary?: string
    meta: Record<string, unknown>
}

export interface StudentDonationItem {
    id: string
    donation_type: 'money' | 'item'
    reference_id: string
    campaign_id: string | null
    campaign_title: string
    campaign_slug: string
    module_id: string | null
    module_title: string
    status: string
    occurred_at: string
    meta: Record<string, unknown>
}

export interface StudentDashboardSummary {
    campaigns_count: number
    money_amount: number
    money_donations_count: number
    item_received_quantity: number
    item_received_count: number
    event_hours: number
    event_completed_count: number
    certificates_count: number
    recent_activities: Array<{
        id: string
        activity_type: StudentActivityItem['activity_type']
        campaign_id: string | null
        campaign_title: string
        campaign_slug: string
        module_id: string | null
        module_title: string
        status: string
        occurred_at: string
        summary: string
    }>
}

export interface StudentActivityQuery {
    type?: StudentActivityItem['activity_type'] | ''
    status?: string
    page?: number
    limit?: number
}

export interface StudentDonationQuery {
    type?: StudentDonationItem['donation_type'] | ''
    status?: string
    page?: number
    limit?: number
}
