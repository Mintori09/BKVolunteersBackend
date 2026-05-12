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

export const rejectRegistration = async (args: {
    id: bigint
    reviewedBy: bigint
    reason: string
}) => {
    return prismaClient.eventRegistration.update({
        where: { id: args.id },
        data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
            reviewedBy: args.reviewedBy,
            reviewNote: args.reason,
        },
    })
}

export const checkInRegistration = async (args: {
    id: bigint
    checkedInAt: Date
}) => {
    return prismaClient.eventRegistration.update({
        where: { id: args.id },
        data: {
            status: 'CHECKED_IN',
            checkedInAt: args.checkedInAt,
        },
    })
}

export const completeRegistration = async (args: {
    id: bigint
    checkedOutAt: Date | null
    hours: number | null
    note: string | null
}) => {
    return prismaClient.eventRegistration.update({
        where: { id: args.id },
        data: {
            status: 'COMPLETED',
            checkedOutAt: args.checkedOutAt,
            hours: args.hours,
            reviewNote: args.note,
        },
    })
}

export const findRegistrationsByModuleId = async (args: {
    moduleId: bigint
    status?: string
    q?: string
    skip: number
    take: number
}) => {
    const where: Record<string, unknown> = { moduleId: args.moduleId }
    if (args.status) where.status = args.status
    if (args.q) {
        where.OR = [
            { student: { fullName: { contains: args.q } } },
            { student: { studentCode: { contains: args.q } } },
        ]
    }
    const [total, items] = await Promise.all([
        prismaClient.eventRegistration.count({ where }),
        prismaClient.eventRegistration.findMany({
            where,
            skip: args.skip,
            take: args.take,
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        studentCode: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
    ])
    return { total, items }
}
