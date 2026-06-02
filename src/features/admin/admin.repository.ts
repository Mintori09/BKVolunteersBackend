import { prismaClient } from 'src/config'

export const findAuditLogs = async (args: {
    page: number
    limit: number
    where: {
        action?: string
        entityType?: string
        entityId?: bigint
        actorType?: string
        actorId?: bigint
        createdAt?: {
            gte?: Date
            lte?: Date
        }
    }
}) => {
    const { page, limit, where } = args
    return Promise.all([
        prismaClient.auditLog.count({ where }),
        prismaClient.auditLog.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
    ])
}

export const findBackgroundJobs = async (args: {
    page: number
    limit: number
    where: {
        type?: string
        status?: string
    }
}) => {
    const { page, limit, where } = args
    return Promise.all([
        prismaClient.backgroundJob.count({ where }),
        prismaClient.backgroundJob.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: [{ runAt: 'asc' }, { createdAt: 'desc' }],
        }),
    ])
}

export const findBackgroundJobById = async (id: bigint) =>
    prismaClient.backgroundJob.findUnique({ where: { id } })
