import { prismaClient } from 'src/config'
import { UserRole } from './types'

export const getUserByEmail = async (email: string) => {
    return prismaClient.user.findUnique({ where: { email } })
}

export const getUserByUsername = async (username: string) => {
    return prismaClient.user.findUnique({ where: { username } })
}

export const getUserByMssv = async (mssv: string) => {
    return prismaClient.student.findUnique({ where: { mssv } })
}

export const getUserById = async (userId: string, role: UserRole) => {
    if (role === 'SINHVIEN') {
        return prismaClient.student.findUnique({ where: { id: userId } })
    }
    return prismaClient.user.findUnique({ where: { id: userId } })
}

export const getRefreshTokenByToken = async (token: string) => {
    const userToken = await prismaClient.refreshToken.findUnique({
        where: { token },
    })
    if (userToken) {
        return { ...userToken, userType: 'user' as const }
    }

    const studentToken = await prismaClient.studentRefreshToken.findUnique({
        where: { token },
    })
    if (studentToken) {
        return { ...studentToken, userType: 'student' as const }
    }

    return null
}

export const deleteRefreshToken = async (token: string, role?: UserRole) => {
    if (role === 'SINHVIEN') {
        return prismaClient.studentRefreshToken.deleteMany({ where: { token } })
    }
    if (role !== undefined) {
        return prismaClient.refreshToken.deleteMany({ where: { token } })
    }

    await prismaClient.refreshToken.deleteMany({ where: { token } })
    await prismaClient.studentRefreshToken.deleteMany({ where: { token } })
}

export const deleteAllUserRefreshTokens = async (
    userId: string,
    role: UserRole
) => {
    if (role === 'SINHVIEN') {
        return prismaClient.studentRefreshToken.deleteMany({
            where: { studentId: userId },
        })
    }
    return prismaClient.refreshToken.deleteMany({ where: { userId } })
}

export const createRefreshToken = async (
    userId: string,
    token: string,
    role: UserRole
) => {
    if (role === 'SINHVIEN') {
        return prismaClient.studentRefreshToken.create({
            data: {
                token,
                studentId: userId,
            },
        })
    }
    return prismaClient.refreshToken.create({
        data: {
            token,
            userId,
        },
    })
}

export const updatePassword = async (
    userId: string,
    hashedPassword: string,
    role: UserRole
) => {
    if (role === 'SINHVIEN') {
        return prismaClient.student.update({
            where: { id: userId },
            data: { password: hashedPassword },
        })
    }
    return prismaClient.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    })
}
