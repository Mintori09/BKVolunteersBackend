export interface CreateItemDonationInput {
    itemPhaseId: number
    itemDescription: string
    proofImageUrl?: string
}

export interface ItemDonationOutput {
    id: string
    studentId: string
    itemPhaseId: number
    itemDescription: string | null
    proofImageUrl: string | null
    status: string
    createdAt: Date
    updatedAt: Date
}

export interface GetItemDonationsQuery {
    status?: string
    page?: number
    limit?: number
}
