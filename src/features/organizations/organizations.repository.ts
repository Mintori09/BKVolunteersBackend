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

export const findBySlug = async (slug: string) => {
    return prismaClient.organization.findUnique({
        where: { code: slug },
        include: {
            faculty: { select: { id: true, code: true, name: true } },
            campaigns: {
                where: {
                    status: { in: ['PUBLISHED', 'ONGOING'] },
                    deletedAt: null,
                },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    summary: true,
                    status: true,
                    coverImageUrl: true,
                    startAt: true,
                    endAt: true,
                },
            },
        },
    })
}
