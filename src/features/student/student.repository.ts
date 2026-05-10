import { prismaClient } from 'src/config'
import { UpdateProfileInput } from './types'

const toBigIntId = (id: string) => BigInt(id)

export const findById = async (id: string) => {
    return prismaClient.student.findUnique({
        where: { id: toBigIntId(id) },
        include: {
            currentTitle: true,
        },
    })
}

export const findByIdWithTitles = async (id: string) => {
    return prismaClient.student.findUnique({
        where: { id: toBigIntId(id) },
        select: {
            id: true,
            studentCode: true,
            fullName: true,
            email: true,
            facultyId: true,
            classCode: true,
            phone: true,
            avatarUrl: true,
            major: true,
            year: true,
            totalPoints: true,
            createdAt: true,
            updatedAt: true,
            currentTitle: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    minPoints: true,
                    iconUrl: true,
                },
            },
        },
    })
}

export const findByIdPublic = async (id: string) => {
    return prismaClient.student.findUnique({
        where: { id: toBigIntId(id) },
        select: {
            id: true,
            studentCode: true,
            fullName: true,
            email: true,
            facultyId: true,
            classCode: true,
            totalPoints: true,
            createdAt: true,
            updatedAt: true,
            currentTitle: {
                select: {
                    id: true,
                    name: true,
                    minPoints: true,
                    iconUrl: true,
                },
            },
        },
    })
}

export const updateProfile = async (id: string, data: UpdateProfileInput) => {
    return prismaClient.student.update({
        where: { id: toBigIntId(id) },
        data: {
            phone: data.phone,
            classCode: data.classCode,
            avatarUrl: data.avatarUrl,
            major: data.major,
            year: data.year,
        },
        select: {
            id: true,
            studentCode: true,
            fullName: true,
            email: true,
            facultyId: true,
            classCode: true,
            phone: true,
            avatarUrl: true,
            major: true,
            year: true,
            totalPoints: true,
        },
    })
}
