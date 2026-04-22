import * as pointTransactionRepo from './pointTransaction.repository'
import { prismaClient } from 'src/config'
import { CreatePointTransactionInput, PointSourceType } from './types'
import { Title } from '@prisma/client'

export const awardPoints = async (params: CreatePointTransactionInput) => {
    const { studentId, points, reason, sourceType, sourceId, awardedBy } =
        params

    await prismaClient.$transaction(async (tx) => {
        await tx.pointTransaction.create({
            data: {
                studentId,
                points,
                reason,
                sourceType,
                sourceId,
                awardedBy,
            },
        })

        await tx.student.update({
            where: { id: studentId },
            data: { totalPoints: { increment: points } },
        })
    })

    const newTitles = await checkAndUnlockTitles(studentId)
    return newTitles
}

export const checkAndUnlockTitles = async (
    studentId: string
): Promise<Title[]> => {
    const student = await prismaClient.student.findUnique({
        where: { id: studentId },
        select: { totalPoints: true },
    })
    if (!student) return []

    const allQualifiedTitles = await prismaClient.title.findMany({
        where: {
            minPoints: { lte: student.totalPoints },
            isActive: true,
        },
    })

    const currentTitles = await prismaClient.studentTitle.findMany({
        where: { studentId },
        select: { titleId: true },
    })
    const currentTitleIds = new Set(currentTitles.map((st) => st.titleId))

    const newTitles = allQualifiedTitles.filter(
        (t) => !currentTitleIds.has(t.id)
    )

    if (newTitles.length > 0) {
        await prismaClient.studentTitle.createMany({
            data: newTitles.map((title) => ({
                studentId,
                titleId: title.id,
            })),
            skipDuplicates: true,
        })
    }

    return newTitles
}
