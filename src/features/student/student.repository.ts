import { prismaClient } from 'src/config'
import { UpdateProfileInput } from './types'

export const findById = async (id: string) => {
    return prismaClient.student.findUnique({
        where: { id },
        include: {
            titles: {
                include: {
                    title: true,
                },
                orderBy: { unlockedAt: 'desc' },
            },
        },
    })
}

export const findByIdWithTitles = async (id: string) => {
    return prismaClient.student.findUnique({
        where: { id },
        select: {
            id: true,
            mssv: true,
            fullName: true,
            email: true,
            facultyId: true,
            className: true,
            phone: true,
            totalPoints: true,
            createdAt: true,
            updatedAt: true,
            titles: {
                include: {
                    title: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            minPoints: true,
                            iconUrl: true,
                            badgeColor: true,
                        },
                    },
                },
                orderBy: { unlockedAt: 'desc' },
            },
        },
    })
}

export const findByIdPublic = async (id: string) => {
    return prismaClient.student.findUnique({
        where: { id },
        select: {
            id: true,
            mssv: true,
            fullName: true,
            email: true,
            facultyId: true,
            className: true,
            totalPoints: true,
            createdAt: true,
            updatedAt: true,
            titles: {
                include: {
                    title: {
                        select: {
                            id: true,
                            name: true,
                            minPoints: true,
                            iconUrl: true,
                        },
                    },
                },
                orderBy: { unlockedAt: 'desc' },
            },
        },
    })
}

export const updateProfile = async (id: string, data: UpdateProfileInput) => {
    return prismaClient.student.update({
        where: { id },
        data,
        select: {
            id: true,
            mssv: true,
            fullName: true,
            email: true,
            facultyId: true,
            className: true,
            phone: true,
            totalPoints: true,
        },
    })
}
