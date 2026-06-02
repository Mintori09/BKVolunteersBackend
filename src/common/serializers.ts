import { PaginatedEnvelope } from './types/canonical.types'

export const serializeId = (value: bigint | number | string | null | undefined) => {
    if (value === null || value === undefined) return null
    if (typeof value === 'string') return Number(value)
    return Number(value)
}

export const serializePagination = <T>(
    items: T[],
    meta: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
): PaginatedEnvelope<T> => ({
    items,
    pagination: meta,
})

