import { prismaClient } from 'src/config'
import { OrganizationListQuery } from './types'

export const findMany = async (_query: OrganizationListQuery) => {
    return prismaClient.organization.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
            faculty: { select: { id: true, code: true, name: true } },
        },
    })
}
