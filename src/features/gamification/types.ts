export type PointSourceType =
    | 'EVENT_PARTICIPATION'
    | 'MONEY_DONATION'
    | 'ITEM_DONATION'
    | 'MANUAL_ADJUSTMENT'
    | 'BONUS'

export interface CreatePointTransactionInput {
    studentId: string
    points: number
    reason: string
    sourceType: PointSourceType
    sourceId?: string
    awardedBy?: string
}

export interface PointTransactionFilter {
    sourceType?: PointSourceType
    fromDate?: Date
    toDate?: Date
}

export interface PaginationQuery {
    page?: number
    limit?: number
}

export interface PaginatedResult<T> {
    items: T[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}
