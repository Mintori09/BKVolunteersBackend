import { prismaClient } from 'src/config'

export const findMany = async () => {
    return prismaClient.organization.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
            faculty: { select: { id: true, code: true, name: true } },
        },
    })
}

export const findById = async (id: bigint) => {
    return prismaClient.organization.findUnique({ where: { id } })
}

export const findByCode = async (code: string) => {
    return prismaClient.organization.findUnique({ where: { code } })
}

export const create = async (data: {
    code: string
    name: string
    type: string
    facultyId?: bigint | null
    logoUrl?: string | null
    description?: string | null
}) => {
    return prismaClient.organization.create({
        data: {
            code: data.code,
            name: data.name,
            type: data.type,
            facultyId: data.facultyId ?? null,
            logoUrl: data.logoUrl ?? null,
            description: data.description ?? null,
        },
        include: {
            faculty: { select: { id: true, code: true, name: true } },
        },
    })
}

export const update = async (
    id: bigint,
    data: {
        code?: string
        name?: string
        type?: string
        facultyId?: bigint | null
        logoUrl?: string | null
        description?: string | null
    }
) => {
    const updateData: Record<string, unknown> = {}
    if (data.code !== undefined) updateData.code = data.code
    if (data.name !== undefined) updateData.name = data.name
    if (data.type !== undefined) updateData.type = data.type
    if (data.facultyId !== undefined) updateData.facultyId = data.facultyId
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl
    if (data.description !== undefined)
        updateData.description = data.description
    return prismaClient.organization.update({
        where: { id },
        data: updateData,
        include: {
            faculty: { select: { id: true, code: true, name: true } },
        },
    })
}

export const softDelete = async (id: bigint) => {
    return prismaClient.organization.update({
        where: { id },
        data: { deletedAt: new Date() },
    })
}
