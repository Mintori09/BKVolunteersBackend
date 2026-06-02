import { prismaClient } from 'src/config'
import { TitleFilter, CreateTitleInput, UpdateTitleInput } from './types'
import { PaginatedResult } from 'src/common/types'
import { Prisma, Title } from '@prisma/client'

const toBigIntId = (id: string | bigint) =>
    typeof id === 'bigint' ? id : BigInt(id)

export const create = async (data: CreateTitleInput): Promise<Title> => {
    return prismaClient.title.create({
        data: {
            name: data.name,
            description: data.description,
            minPoints: data.minPoints,
            iconUrl: data.iconUrl,
            badgeColor: data.badgeColor,
        } satisfies Prisma.TitleCreateInput,
    })
}

export const updateById = async (
    id: string | bigint,
    data: UpdateTitleInput
): Promise<Title> => {
    return prismaClient.title.update({
        where: { id: toBigIntId(id) },
        data,
    })
}

export const deleteById = async (id: string | bigint): Promise<Title> => {
    return prismaClient.title.delete({
        where: { id: toBigIntId(id) },
    })
}

export const findById = async (id: string | bigint): Promise<Title | null> => {
    return prismaClient.title.findUnique({
        where: { id: toBigIntId(id) },
    })
}

export const findMany = async (
    filters: TitleFilter
): Promise<PaginatedResult<Title>> => {
    const { page = 1, limit = 10, isActive } = filters

    const where: Prisma.TitleWhereInput = {
        ...(isActive === undefined ? {} : { isActive }),
    }

    const [items, total] = await Promise.all([
        prismaClient.title.findMany({
            where,
            orderBy: { minPoints: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prismaClient.title.count({ where }),
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

export const findTitlesBelowPoints = async (
    points: number
): Promise<Title[]> => {
    return prismaClient.title.findMany({
        where: {
            minPoints: { lte: points },
        },
        orderBy: { minPoints: 'asc' },
    })
}
