export interface ItemDonationModuleParams {
    moduleId: string
}

export interface ItemDonationPledgeParams {
    id: string
}

export interface CreateItemPledgeBody {
    item_target_id: string
    quantity: number
    donor_name?: string
    note?: string
}

export interface ConfirmItemPledgeBody {}

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
