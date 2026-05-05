import { prismaClient } from 'src/config'
import { randomUUID } from 'node:crypto'
import { sendResetEmail } from 'src/utils/sendEmail.util'
import * as argon2 from 'argon2'

export const createResetToken = async (userId: string, email: string) => {
    const resetToken = randomUUID()
    const expiresAt = new Date(Date.now() + 3600000)

    await prismaClient.resetToken.create({
        data: {
            token: resetToken,
            expiresAt,
            userId,
        },
    })

    sendResetEmail(email, resetToken)
    return resetToken
}

export const getResetToken = async (token: string) => {
    return prismaClient.resetToken.findFirst({
        where: {
            token,
            expiresAt: { gt: new Date() },
        },
    })
}

export const resetUserPassword = async (
    userId: string,
    newPassword: string
) => {
    const hashedPassword = await argon2.hash(newPassword)

    await prismaClient.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    })

    // Clean up tokens
    await prismaClient.resetToken.deleteMany({ where: { userId } })
    await prismaClient.refreshToken.deleteMany({ where: { userId } })
}
