import { Prisma } from '@prisma/client'
import { prismaClient } from 'src/config'

export const toJsonValue = (value: unknown) =>
    value === null || value === undefined
        ? Prisma.JsonNull
        : (value as Prisma.InputJsonValue)

export const findModuleById = async (moduleId: bigint) => {
    return prismaClient.campaignModule.findFirst({
        where: {
            id: moduleId,
            deletedAt: null,
            campaign: {
                deletedAt: null,
            },
        },
        include: {
            campaign: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    status: true,
                    organizationId: true,
                },
            },
            eventRegistrations: {
                select: { id: true, status: true },
            },
        },
    })
}

export const findModuleBaseById = async (moduleId: bigint) => {
    return prismaClient.campaignModule.findFirst({
        where: {
            id: moduleId,
            deletedAt: null,
            campaign: {
                deletedAt: null,
            },
        },
        include: {
            campaign: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    status: true,
                    organizationId: true,
                },
            },
        },
    })
}

export const updateModuleConfig = async (args: {
    moduleId: bigint
    settingsJson: Record<string, unknown>
}) => {
    return prismaClient.campaignModule.update({
        where: { id: args.moduleId },
        data: {
            settingsJson: toJsonValue(args.settingsJson),
        },
    })
}

export const findRegistrationByModuleAndStudent = async (args: {
    moduleId: bigint
    studentId: bigint
}) => {
    return prismaClient.eventRegistration.findUnique({
        where: {
            moduleId_studentId: {
                moduleId: args.moduleId,
                studentId: args.studentId,
            },
        },
    })
}

export const createRegistration = async (args: {
    moduleId: bigint
    campaignId: bigint
    studentId: bigint
    answersJson: unknown
    status: string
}) => {
    return prismaClient.eventRegistration.create({
        data: {
            campaignId: args.campaignId,
            moduleId: args.moduleId,
            studentId: args.studentId,
            status: args.status,
            answersJson: toJsonValue(args.answersJson),
            reviewedAt: args.status === 'APPROVED' ? new Date() : null,
        },
    })
}

export const countRegistrationsByModule = async (args: {
    moduleId: bigint
    statuses?: string[]
}) => {
    return prismaClient.eventRegistration.count({
        where: {
            moduleId: args.moduleId,
            ...(args.statuses?.length
                ? { status: { in: args.statuses } }
                : {}),
        },
    })
}

export const findRegistrationById = async (id: bigint) => {
    return prismaClient.eventRegistration.findUnique({
        where: { id },
        include: {
            campaign: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    status: true,
                    organizationId: true,
                },
            },
            module: {
                select: {
                    id: true,
                    title: true,
                    type: true,
                    status: true,
                    startAt: true,
                    endAt: true,
                    settingsJson: true,
                },
            },
            student: {
                select: {
                    id: true,
                    fullName: true,
                    studentCode: true,
                    email: true,
                },
            },
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
    const where: Prisma.EventRegistrationWhereInput = {
        moduleId: args.moduleId,
        ...(args.status ? { status: args.status } : {}),
        ...(args.q
            ? {
                  OR: [
                      { student: { fullName: { contains: args.q } } },
                      { student: { studentCode: { contains: args.q } } },
                      { student: { email: { contains: args.q } } },
                  ],
              }
            : {}),
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
