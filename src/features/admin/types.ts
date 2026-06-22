export interface AdminAuditLogsQuery {
    page?: number
    limit?: number
    action?: string
    entity_type?: string
    entity_id?: string
    actor_type?: string
    actor_id?: string
}

export interface AdminBackgroundJobsQuery {
    page?: number
    limit?: number
    type?: string
    status?: string
}

export interface AdminAuditLogOutput {
    id: number
    actor_type: string
    actor_id: number
    action: string
    entity_type: string
    entity_id: number
    before_json: unknown
    after_json: unknown
    ip_address: string | null
    created_at: Date
}

export interface AdminBackgroundJobOutput {
    id: number
    type: string
    status: string
    payload_json: unknown
    attempts: number
    last_error: string | null
    run_at: Date
    locked_at: Date | null
    created_at: Date
    updated_at: Date
}

export interface AdminAuditLogListOutput {
    items: AdminAuditLogOutput[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export interface AdminBackgroundJobListOutput {
    items: AdminBackgroundJobOutput[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export interface AdminOrganizationIdParams {
    id: string
}

export interface AdminCreateOrganizationBody {
    code: string
    name: string
    type: string
    faculty_id?: string
    logo_url?: string | null
    description?: string | null
}

export interface AdminUpdateOrganizationBody {
    code?: string
    name?: string
    type?: string
    faculty_id?: string | null
    logo_url?: string | null
    description?: string | null
}

export interface AdminOrganizationOutput {
    id: number
    code: string
    name: string
    type: string
    status: string
    logo_url: string | null
    description: string | null
    faculty: { id: number; code: string; name: string } | null
    created_at: Date
    updated_at: Date
}

export interface AdminOrganizationListOutput {
    items: AdminOrganizationOutput[]
}
