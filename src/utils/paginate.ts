import { HttpStatus } from 'src/common/constants'
import { ApiError } from './ApiError'

export interface PaginationOptions {
    page?: number | string
    limit?: number | string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    searchFields?: string[]
}

export interface PaginatedResult<T> {
    data: T[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

/**
 * Generic pagination utility for Prisma.
 * @param model - Prisma model (e.g., prismaClient.user)
 * @param options - Pagination options (page, limit, sortBy, sortOrder, search, searchFields)
 * @param args - Additional Prisma findMany arguments (e.g., where, select, include)
 */
export const paginate = async <T>(
    model: any,
    options: PaginationOptions = {},
    args: any = {}
): Promise<PaginatedResult<T>> => {
    try {
        const page = Math.max(Number(options.page) || 1, 1)
        const limit = Math.max(Number(options.limit) || 10, 1)
        const skip = (page - 1) * limit

        const sortBy = options.sortBy || 'createdAt'
        const sortOrder = options.sortOrder || 'desc'

        // Initialize where clause
        const where: any = { ...(args.where || {}) }

        // Simple search logic
        if (options.search && options.searchFields?.length) {
            where.OR = options.searchFields.map((field) => ({
                [field]: {
                    contains: options.search,
                },
            }))
        }

        const [data, total] = await Promise.all([
            model.findMany({
                ...args,
                where,
                skip,
                take: limit,
                orderBy: {
                    [sortBy]: sortOrder,
                },
            }),
            model.count({ where }),
        ])

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        }
    } catch (error: any) {
        throw new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            `Pagination failed: ${error.message}`
        )
    }
}
