import { prismaClient } from 'src/config'

export const findModuleById = async (moduleId: bigint) => {
    return prismaClient.campaignModule.findUnique({
        where: { id: moduleId },
        include: {
            campaign: {
                select: { id: true, title: true, slug: true, status: true },
            },
            itemTargets: true,
            itemPledges: {
                where: { status: { in: ['CONFIRMED', 'RECEIVED'] } },
            },
        },
    })
}

export const findModuleWithCampaign = async (moduleId: bigint) => {
    return prismaClient.campaignModule.findUnique({
        where: { id: moduleId },
        include: { campaign: true },
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

export const createPledge = async (args: {
    campaignId: bigint
    moduleId: bigint
    itemTargetId: bigint
    studentId: bigint
    donorName: string
    quantity: number
    note: string | null
}) => {
    return prismaClient.itemPledge.create({
        data: args,
    })
}

export const confirmPledge = async (id: bigint) => {
    return prismaClient.itemPledge.update({
        where: { id },
        data: { status: 'CONFIRMED' },
    })
}
