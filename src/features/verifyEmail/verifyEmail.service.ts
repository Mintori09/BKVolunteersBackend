import { prismaClient } from 'src/config'
import { randomUUID } from 'node:crypto'
import { sendVerifyEmail } from 'src/utils/sendEmail.util'

export const createVerificationToken = async (
    userId: string,
    email: string
) => {
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 3600000)

    await prismaClient.emailVerificationToken.create({
        data: {
            token,
            expiresAt,
            userId,
        },
    })

    sendVerifyEmail(email, token)
    return token
}

export const getExistingValidToken = async (userId: string) => {
    return prismaClient.emailVerificationToken.findFirst({
        where: {
            userId,
            expiresAt: { gt: new Date() },
        },
    })
}

export const getVerificationToken = async (token: string) => {
    return prismaClient.emailVerificationToken.findUnique({
        where: { token },
    })
}

export const verifyUserEmail = async (userId: string) => {
    await prismaClient.user.update({
        where: { id: userId },
        data: { emailVerified: new Date() },
    })

    await prismaClient.emailVerificationToken.deleteMany({
        where: { userId },
    })
}
