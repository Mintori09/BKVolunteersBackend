export type EventRegistrationRecord = {
    id: string
    campaign_id: string
    module_id: string
    student: {
        id: string
        full_name: string
        student_code: string
        email: string
    }
    status:
        | 'PENDING'
        | 'APPROVED'
        | 'REJECTED'
        | 'CANCELLED'
        | 'CHECKED_IN'
        | 'COMPLETED'
    answers?: Record<string, unknown>
    registered_at: string
    reviewed_at?: string | null
    review_note?: string | null
    checked_in_at?: string | null
    checked_out_at?: string | null
    hours?: number | null
}
