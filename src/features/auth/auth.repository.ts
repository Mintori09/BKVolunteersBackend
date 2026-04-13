import { prismaClient } from 'src/config'
import { UserSignUpCredentials } from './types'

export const createUser = async (
    data: UserSignUpCredentials,
    hashedPassword: string
) => {
    return prismaClient.user.create({
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            name: data.username,
            email: data.email,
            password: hashedPassword,
        },
    })
}

export const getUserByEmail = async (email: string) => {
    return prismaClient.user.findUnique({ where: { email } })
}

export const getUserByUsername = async (username: string) => {
    return prismaClient.user.findFirst({
        where: { name: username },
    })
}

export const getUserById = async (userId: string) => {
    return prismaClient.user.findUnique({ where: { id: userId } })
}

export const getStudentByMssv = async (mssv: string) => {
    return prismaClient.student.findUnique({
        where: { mssv },
        include: {
            faculty: true,
        },
    })
}

export const getStudentById = async (studentId: string) => {
    return prismaClient.student.findUnique({
        where: { id: studentId },
        include: {
            faculty: true,
        },
    })
}

export const getManagerByIdentifier = async (identifier: string) => {
    const normalizedIdentifier = identifier.trim()
    const normalizedEmail = normalizedIdentifier.toLowerCase()

    return prismaClient.managerAccount.findFirst({
        where: {
            OR: [
                { username: normalizedIdentifier },
                { username: normalizedEmail },
                { email: normalizedEmail },
            ],
        },
        include: {
            faculty: true,
            club: true,
        },
    })
}

export const getManagerById = async (managerId: string) => {
    return prismaClient.managerAccount.findUnique({
        where: { id: managerId },
        include: {
            faculty: true,
            club: true,
        },
    })
}

export const createEmailVerificationToken = async (
    userId: string,
    token: string,
    expiresAt: Date
) => {
    return prismaClient.emailVerificationToken.create({
        data: {
            token,
            expiresAt,
            userId,
        },
    })
}

export const getRefreshTokenByToken = async (token: string) => {
    return prismaClient.refreshToken.findUnique({ where: { token } })
}

export const deleteRefreshToken = async (token: string) => {
    return prismaClient.refreshToken.deleteMany({ where: { token } })
}

export const deleteAllUserRefreshTokens = async (userId: string) => {
    return prismaClient.refreshToken.deleteMany({ where: { userId } })
}

export const createRefreshToken = async (userId: string, token: string) => {
    return prismaClient.refreshToken.create({
        data: {
            token,
            userId,
        },
    })
}

export const createStudentRefreshToken = async (
    studentId: string,
    token: string
) => {
    return prismaClient.studentRefreshToken.create({
        data: {
            token,
            studentId,
        },
    })
}

export const getStudentRefreshTokenByToken = async (token: string) => {
    return prismaClient.studentRefreshToken.findUnique({ where: { token } })
}

export const deleteStudentRefreshToken = async (token: string) => {
    return prismaClient.studentRefreshToken.deleteMany({ where: { token } })
}

export const deleteAllStudentRefreshTokens = async (studentId: string) => {
    return prismaClient.studentRefreshToken.deleteMany({ where: { studentId } })
}

export const updatePassword = async (
    userId: string,
    hashedPassword: string
) => {
    return prismaClient.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    })
}
