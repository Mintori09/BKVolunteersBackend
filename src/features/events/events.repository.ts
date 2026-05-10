import { Prisma } from '@prisma/client'
import { prismaClient } from 'src/config'

export const toJsonValue = (value: unknown) =>
    value === null || value === undefined
        ? Prisma.JsonNull
        : (value as Prisma.InputJsonValue)

export const findModuleById = async (moduleId: bigint) => {
    return prismaClient.campaignModule.findUnique({
        where: { id: moduleId },
        include: {
            campaign: {
                select: { id: true, title: true, slug: true, status: true },
            },
            eventRegistrations: {
                select: { id: true, status: true },
            },
        },
    })
}

export const findModuleBaseById = async (moduleId: bigint) => {
    return prismaClient.campaignModule.findUnique({
        where: { id: moduleId },
    })
}

export const upsertRegistration = async (args: {
    moduleId: bigint
    campaignId: bigint
    studentId: bigint
    answersJson: unknown
}) => {
    const { moduleId, campaignId, studentId, answersJson } = args
    return prismaClient.eventRegistration.upsert({
        where: {
            moduleId_studentId: { moduleId, studentId },
        },
        update: {
            answersJson: toJsonValue(answersJson),
            status: 'PENDING',
        },
        create: {
            campaignId,
            moduleId,
            studentId,
            answersJson: toJsonValue(answersJson),
        },
    })
}

export const approveRegistration = async (args: {
    id: bigint
    reviewedBy: bigint
    note: string | null
}) => {
    return prismaClient.eventRegistration.update({
        where: { id: args.id },
        data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedBy: args.reviewedBy,
            reviewNote: args.note,
        },
    })
}
