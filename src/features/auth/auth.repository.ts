import { prismaClient } from 'src/config'
<<<<<<< HEAD
import { UserSignUpCredentials } from './types'

export const createUser = async (
    data: UserSignUpCredentials,
    hashedPassword: string
) => {
    return prismaClient.user.create({
        data: {
            username: data.username,
            email: data.email,
            password: hashedPassword,
        },
    })
}
||||||| parent of 814f25f (feat(auth): remove signup functionality)
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
=======
>>>>>>> 814f25f (feat(auth): remove signup functionality)

export const getUserByEmail = async (email: string) => {
    return prismaClient.user.findUnique({ where: { email } })
}

export const getUserById = async (userId: string) => {
    return prismaClient.user.findUnique({ where: { id: userId } })
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

export const updatePassword = async (
    userId: string,
    hashedPassword: string
) => {
    return prismaClient.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    })
}
