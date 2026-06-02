export interface ItemDonationModuleParams {
    moduleId: string
}

export interface ItemDonationPledgeParams {
    id: string
}

export interface ItemDonationTargetParams {
    id: string
}

export interface CreateItemPledgeBody {
    item_target_id: string
    quantity: number
    donor_name?: string
    expected_handover_at?: string
    note?: string
}

export interface ConfirmItemPledgeBody {}

export interface ItemDonationConfigBody {
    receiver_address: string
    receiver_contact: string
    allow_over_target: boolean
    handover_note?: string | null
}

export interface CreateItemTargetBody {
    name: string
    unit: string
    target_quantity: number
    description?: string
}

export interface UpdateItemTargetBody {
    name: string
    unit: string
    target_quantity: number
    description?: string
    status: 'ACTIVE' | 'CLOSED'
}

export interface ItemDonationTargetListQuery {
    status?: 'ACTIVE' | 'CLOSED'
}

export interface ItemDonationPledgeListQuery {
    status?: string
    q?: string
    page?: number
    limit?: number
}

export interface RejectItemPledgeBody {
    reason: string
}

export interface ItemPledgeHandoverBody {
    received_quantity: number
    received_at?: string
    location?: string
    note?: string
    evidence_url?: string
}

export interface ItemDonationModuleOutput {
    id: number
    campaign_id: number
    type: string
    title: string
    description: string | null
    status: string
    settings_json: unknown
    targets: Array<{
        id: number
        name: string
        unit: string
        target_quantity: number
        received_quantity: number
    }>
    pledged_quantity: number
    campaign: {
        id: number
        title: string
        slug: string
        status: string
    }
}

export interface CreateItemPledgeOutput {
    id: number
    status: string
    quantity: number
    item_target_id: number
}

export interface ConfirmItemPledgeOutput {
    id: number
    status: string
}

export interface ItemDonationConfigOutput {
    module_id: number
    config: Record<string, unknown>
}

export interface ItemTargetOutput {
    id: number
    module_id: number
    campaign_id: number
    name: string
    unit: string
    target_quantity: number
    received_quantity: number
    remaining_quantity: number
    description: string | null
    status: string
}

export interface ItemPledgeOutput {
    id: number
    module_id: number
    campaign_id: number
    item_target: {
        id: number
        name: string
        unit: string
    }
    student: {
        id: number
        full_name: string
        student_code: string
    }
    donor_name: string
    quantity: number
    status: string
    note: string | null
    expected_handover_at: string | null
    received_quantity: number | null
    received_at: string | null
    created_at: string
}

export interface ItemPledgeTransitionOutput {
    id: number
    status: string
}

export interface ItemPledgeHandoverOutput {
    pledge_id: number
    handover_id: string
    status: string
}
