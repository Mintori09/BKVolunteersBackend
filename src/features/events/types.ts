export interface EventModuleParams {
    moduleId: string
}

export interface EventRegistrationParams {
    id: string
}

export interface EventRegisterBody {
    answers_json?: Record<string, unknown> | null
}

export interface EventApproveBody {
    note?: string
}

export interface EventModuleOutput {
    id: number
    campaign_id: number
    type: string
    title: string
    description: string | null
    status: string
    start_at: Date
    end_at: Date
    settings_json: unknown
    registration_count: number
    approved_count: number
    campaign: {
        id: number
        title: string
        slug: string
        status: string
    }
}

export interface EventRegisterOutput {
    id: number
    status: string
    module_id: number
}

export interface EventApproveOutput {
    id: number
    status: string
}
