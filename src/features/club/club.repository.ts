import { prismaClient } from 'src/config'
import { ClubFilter, CreateClubInput, UpdateClubInput } from './types'
import { PaginatedResult } from '../gamification/types'
import { Club } from '@prisma/client'

export const create = async (data: CreateClubInput): Promise<Club> => {
    return prismaClient.club.create({
        data: {
            name: data.name,
            facultyId: data.facultyId,
            leaderId: data.leaderId,
        },
        include: {
            faculty: true,
            leader: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                },
            },
        },
    })
}

export const updateById = async (
    id: string,
    data: UpdateClubInput
): Promise<Club> => {
    return prismaClient.club.update({
        where: { id },
        data,
        include: {
            faculty: true,
            leader: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                },
            },
        },
    })
}

export const deleteById = async (id: string): Promise<Club> => {
    return prismaClient.club.delete({
        where: { id },
    })
}

export const findById = async (id: string) => {
    return prismaClient.club.findUnique({
        where: { id },
        include: {
            faculty: true,
            leader: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                },
            },
        },
    })
}

export const findMany = async (
    filters: ClubFilter
): Promise<PaginatedResult<any>> => {
    const { page = 1, limit = 20, facultyId, search } = filters

    const where: any = { deletedAt: null }
    if (facultyId) {
        where.facultyId = facultyId
    }
    if (search) {
        where.name = { contains: search }
    }

    const [items, total] = await Promise.all([
        prismaClient.club.findMany({
            where,
            orderBy: { name: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                faculty: true,
                leader: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        }),
        prismaClient.club.count({ where }),
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

export const softDeleteById = async (id: string): Promise<Club> => {
    return prismaClient.club.update({
        where: { id },
        data: { deletedAt: new Date() },
    })
}
