export interface ApprovalQueueQuery {
    page?: number
    limit?: number
    status?: string
    module_type?: string
    q?: string
    organization_id?: string
    faculty_id?: string
}

export interface ApprovalQueueItemOutput {
    id: number
    title: string
    slug: string
    summary: string | null
    scope_type: string
    status: string
    organization: {
        id: number
        code: string
        name: string
        type: string
    } | null
    faculty: {
        id: number
        code: string
        name: string
    } | null
    created_by: {
        id: number
        full_name: string
        email: string
        role: string
    } | null
    last_review: {
        id: number
        body: string | null
        author_id: number
        author_type: string
        created_at: Date
    } | null
    last_activity: {
        id: number
        activity_type: string
        message: string | null
        created_at: Date
    } | null
    updated_at: Date
}

export interface ApprovalQueueOutput {
    items: ApprovalQueueItemOutput[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}
