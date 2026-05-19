export interface PaginationMeta {
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface PaginatedResult<T> {
    items: T[]
    meta: PaginationMeta
}
