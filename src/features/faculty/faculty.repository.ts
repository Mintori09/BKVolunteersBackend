import { prismaClient } from 'src/config'
import {
    FacultyFilter,
    CreateFacultyInput,
    UpdateFacultyInput,
    FacultyStats,
} from './types'
import { PaginatedResult } from '../gamification/types'
import { Faculty } from '@prisma/client'

export const create = async (data: CreateFacultyInput): Promise<Faculty> => {
    return prismaClient.faculty.create({
        data: {
            code: data.code,
            name: data.name,
        },
    })
}

export const updateById = async (
    id: number,
    data: UpdateFacultyInput
): Promise<Faculty> => {
    return prismaClient.faculty.update({
        where: { id },
        data,
    })
}

export const deleteById = async (id: number): Promise<Faculty> => {
    return prismaClient.faculty.delete({
        where: { id },
    })
}

export const findById = async (id: number): Promise<Faculty | null> => {
    return prismaClient.faculty.findUnique({
        where: { id },
    })
}

export const findByCode = async (code: string): Promise<Faculty | null> => {
    return prismaClient.faculty.findUnique({
        where: { code },
    })
}

export const findMany = async (
    filters: FacultyFilter
): Promise<PaginatedResult<Faculty>> => {
    const { page = 1, limit = 20, search } = filters

    const where: any = {}
    if (search) {
        where.OR = [
            { code: { contains: search } },
            { name: { contains: search } },
        ]
    }

    const [items, total] = await Promise.all([
        prismaClient.faculty.findMany({
            where,
            orderBy: { code: 'asc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prismaClient.faculty.count({ where }),
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

export const findStatsById = async (id: number): Promise<FacultyStats> => {
    const faculty = await prismaClient.faculty.findUnique({
        where: { id },
        select: { code: true },
    })

    if (!faculty) {
        return {
            totalStudents: 0,
            totalUsers: 0,
            totalClubs: 0,
            totalPoints: 0,
        }
    }

    const [studentStats, userCount, clubCount] = await Promise.all([
        prismaClient.student.aggregate({
            where: { facultyId: faculty.code },
            _count: true,
            _sum: { totalPoints: true },
        }),
        prismaClient.user.count({
            where: { facultyId: id },
        }),
        prismaClient.club.count({
            where: { facultyId: id },
        }),
    ])

    return {
        totalStudents: studentStats._count,
        totalUsers: userCount,
        totalClubs: clubCount,
        totalPoints: studentStats._sum.totalPoints || 0,
    }
}

export const findAll = async (): Promise<Faculty[]> => {
    return prismaClient.faculty.findMany({
        orderBy: { code: 'asc' },
    })
}
