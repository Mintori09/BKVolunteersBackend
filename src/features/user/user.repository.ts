import { prismaClient } from 'src/config'
import { CreateUserInput } from './types'

export const findByUsername = async (username: string) => {
    return prismaClient.user.findUnique({
        where: { username },
    })
}

export const findByEmail = async (email: string) => {
    return prismaClient.user.findUnique({
        where: { email },
    })
}

export const createUser = async (data: CreateUserInput) => {
    return prismaClient.user.create({
        data,
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            facultyId: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
        },
    })
}
