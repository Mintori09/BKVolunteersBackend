export interface CreateItemPhaseInput {
    acceptedItems: string[]
    collectionAddress?: string
    startDate?: Date
    endDate?: Date
}

export interface UpdateItemPhaseInput {
    acceptedItems?: string[]
    collectionAddress?: string
    startDate?: Date
    endDate?: Date
}

export interface ItemPhaseOutput {
    id: number
    campaignId: string
    acceptedItems: string[]
    collectionAddress: string | null
    startDate: Date | null
    endDate: Date | null
    createdAt: Date
    updatedAt: Date
}

export interface ItemPhaseParams {
    campaignId: string
    phaseId?: string
}
