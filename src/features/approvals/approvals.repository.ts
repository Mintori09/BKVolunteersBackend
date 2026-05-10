import { prismaClient } from 'src/config'

export const APPROVAL_STATUSES = ['SUBMITTED', 'PRE_APPROVED', 'REVISION_REQUIRED']

export const findApprovalQueue = async (args: {
    page: number
    limit: number
    where: Record<string, unknown>
}) => {
    const { page, limit, where } = args
    return Promise.all([
        prismaClient.campaign.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { updatedAt: 'desc' },
            include: {
                organization: {
                    select: { id: true, code: true, name: true, type: true },
                },
                faculty: {
                    select: { id: true, code: true, name: true },
                },
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                    },
                },
                reviews: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                activities: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        }),
        prismaClient.campaign.count({ where }),
    ])
}
