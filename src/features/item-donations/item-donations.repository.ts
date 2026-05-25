import { Prisma } from '@prisma/client'
import { prismaClient } from 'src/config'

const toJsonValue = (value: unknown) =>
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
            itemTargets: true,
            itemPledges: {
                where: { status: { in: ['PLEDGED', 'CONFIRMED', 'RECEIVED'] } },
            },
        },
    })
}

export const findModuleWithCampaign = async (moduleId: bigint) => {
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

export const createTarget = async (args: {
    campaignId: bigint
    moduleId: bigint
    name: string
    unit: string
    targetQuantity: number
    description?: string | null
}) => {
    return prismaClient.itemTarget.create({
        data: {
            campaignId: args.campaignId,
            moduleId: args.moduleId,
            name: args.name,
            unit: args.unit,
            targetQuantity: args.targetQuantity,
            description: args.description ?? null,
        },
    })
}

export const findTargets = async (args: {
    moduleId: bigint
    status?: 'ACTIVE' | 'CLOSED'
}) => {
    return prismaClient.itemTarget.findMany({
        where: {
            moduleId: args.moduleId,
            ...(args.status ? { status: args.status } : {}),
        },
        orderBy: { createdAt: 'asc' },
    })
}

export const findTarget = async (args: {
    id: bigint
    moduleId: bigint
    campaignId: bigint
}) => {
    return prismaClient.itemTarget.findFirst({
        where: {
            id: args.id,
            moduleId: args.moduleId,
            campaignId: args.campaignId,
        },
    })
}

export const findTargetById = async (id: bigint) => {
    return prismaClient.itemTarget.findUnique({
        where: { id },
        include: {
            campaign: {
                select: {
                    id: true,
                    organizationId: true,
                },
            },
            module: {
                select: {
                    id: true,
                    campaignId: true,
                },
            },
            _count: {
                select: {
                    pledges: true,
                },
            },
        },
    })
}

export const updateTarget = async (args: {
    id: bigint
    name: string
    unit: string
    targetQuantity: number
    description?: string | null
    status: 'ACTIVE' | 'CLOSED'
}) => {
    return prismaClient.itemTarget.update({
        where: { id: args.id },
        data: {
            name: args.name,
            unit: args.unit,
            targetQuantity: args.targetQuantity,
            description: args.description ?? null,
            status: args.status,
        },
    })
}

export const deleteTarget = async (id: bigint) => {
    return prismaClient.itemTarget.delete({
        where: { id },
    })
}

export const sumReservedQuantityByTarget = async (itemTargetId: bigint) => {
    const result = await prismaClient.itemPledge.aggregate({
        where: {
            itemTargetId,
            status: { in: ['PLEDGED', 'CONFIRMED', 'RECEIVED'] },
        },
        _sum: { quantity: true },
    })

    return result._sum.quantity ?? 0
}

export const createPledge = async (args: {
    campaignId: bigint
    moduleId: bigint
    itemTargetId: bigint
    studentId: bigint
    donorName: string
    quantity: number
    note: string | null
    expectedHandoverAt?: Date | null
}) => {
    return prismaClient.itemPledge.create({
        data: {
            campaignId: args.campaignId,
            moduleId: args.moduleId,
            itemTargetId: args.itemTargetId,
            studentId: args.studentId,
            donorName: args.donorName,
            quantity: args.quantity,
            note: args.note,
            expectedHandoverAt: args.expectedHandoverAt ?? null,
        },
    })
}

export const findPledgesByModuleId = async (args: {
    moduleId: bigint
    status?: string
    q?: string
    skip: number
    take: number
}) => {
    const where: Prisma.ItemPledgeWhereInput = {
        moduleId: args.moduleId,
        ...(args.status ? { status: args.status } : {}),
        ...(args.q
            ? {
                  OR: [
                      { donorName: { contains: args.q } },
                      { student: { fullName: { contains: args.q } } },
                      { student: { studentCode: { contains: args.q } } },
                      { itemTarget: { name: { contains: args.q } } },
                  ],
              }
            : {}),
    }

    const [total, items] = await Promise.all([
        prismaClient.itemPledge.count({ where }),
        prismaClient.itemPledge.findMany({
            where,
            skip: args.skip,
            take: args.take,
            orderBy: { createdAt: 'desc' },
            include: {
                itemTarget: {
                    select: { id: true, name: true, unit: true },
                },
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        studentCode: true,
                    },
                },
            },
        }),
    ])

    return { total, items }
}

export const findPledgeById = async (id: bigint) => {
    return prismaClient.itemPledge.findUnique({
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
                    settingsJson: true,
                },
            },
            itemTarget: {
                select: {
                    id: true,
                    name: true,
                    unit: true,
                    targetQuantity: true,
                    receivedQuantity: true,
                    status: true,
                },
            },
            student: {
                select: {
                    id: true,
                    fullName: true,
                    studentCode: true,
                },
            },
        },
    })
}

export const confirmPledge = async (id: bigint) => {
    return prismaClient.itemPledge.update({
        where: { id },
        data: { status: 'CONFIRMED' },
    })
}

export const rejectPledge = async (args: { id: bigint; reason: string }) => {
    return prismaClient.itemPledge.update({
        where: { id: args.id },
        data: {
            status: 'REJECTED',
            handoverNote: args.reason,
        },
    })
}

export const handoverPledge = async (args: {
    id: bigint
    receivedQuantity: number
    receivedAt: Date
    evidenceUrl?: string | null
    handoverNote?: string | null
}) => {
    return prismaClient.$transaction(async (tx) => {
        const pledge = await tx.itemPledge.findUnique({
            where: { id: args.id },
            select: {
                id: true,
                itemTargetId: true,
                receivedQuantity: true,
                itemTarget: {
                    select: { receivedQuantity: true },
                },
            },
        })

        if (!pledge) {
            return null
        }

        const previousReceived = pledge.receivedQuantity ?? 0
        const delta = args.receivedQuantity - previousReceived

        const updatedPledge = await tx.itemPledge.update({
            where: { id: args.id },
            data: {
                status: 'RECEIVED',
                receivedQuantity: args.receivedQuantity,
                receivedAt: args.receivedAt,
                evidenceUrl: args.evidenceUrl ?? null,
                handoverNote: args.handoverNote ?? null,
            },
        })

        await tx.itemTarget.update({
            where: { id: pledge.itemTargetId },
            data: {
                receivedQuantity: pledge.itemTarget.receivedQuantity + delta,
            },
        })

        return updatedPledge
    })
}
