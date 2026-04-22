import { prismaClient } from 'src/config'
import {
    CreatePointTransactionInput,
    PointTransactionFilter,
    PaginatedResult,
} from './types'
import { PointTransaction } from '@prisma/client'

export const create = async (data: CreatePointTransactionInput) => {
    return prismaClient.pointTransaction.create({
        data: {
            studentId: data.studentId,
            points: data.points,
            reason: data.reason,
            sourceType: data.sourceType,
            sourceId: data.sourceId,
            awardedBy: data.awardedBy,
        },
    })
}

export const findManyByStudentId = async (
    studentId: string,
    filters: PointTransactionFilter,
    page: number = 1,
    limit: number = 10
): Promise<PaginatedResult<PointTransaction>> => {
    const where: any = { studentId }

    if (filters.sourceType) {
        where.sourceType = filters.sourceType
    }

    if (filters.fromDate || filters.toDate) {
        where.createdAt = {}
        if (filters.fromDate) {
            where.createdAt.gte = filters.fromDate
        }
        if (filters.toDate) {
            where.createdAt.lte = filters.toDate
        }
    }

    const [items, total] = await Promise.all([
        prismaClient.pointTransaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prismaClient.pointTransaction.count({ where }),
    ])

    return {
        items,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    }
}

export const sumPointsByStudentId = async (studentId: string) => {
    const result = await prismaClient.pointTransaction.aggregate({
        where: { studentId },
        _sum: { points: true },
    })
    return result._sum.points || 0
}
