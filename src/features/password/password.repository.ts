import { prismaClient } from 'src/config'
import type { PasswordResetTokenRow } from './types'

export const createResetToken = async (
    email: string,
    codeHash: string,
    expiresAt: Date,
): Promise<void> => {
    await prismaClient.passwordResetToken.create({
        data: {
            email,
            codeHash,
            expiresAt,
        },
    })
}

export const findLatestValidToken = async (
    email: string,
): Promise<PasswordResetTokenRow | null> => {
    return prismaClient.passwordResetToken.findFirst({
        where: {
            email,
            usedAt: null,
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
    }) as Promise<PasswordResetTokenRow | null>
}

export const markTokenAsUsed = async (id: bigint): Promise<void> => {
    await prismaClient.passwordResetToken.update({
        where: { id },
        data: { usedAt: new Date() },
    })
}

export const markAllTokensAsUsed = async (email: string): Promise<void> => {
    await prismaClient.passwordResetToken.updateMany({
        where: { email, usedAt: null },
        data: { usedAt: new Date() },
    })
}
