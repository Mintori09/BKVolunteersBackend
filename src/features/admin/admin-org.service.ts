import { HttpStatus } from 'src/common/constants'
import { serializeId } from 'src/common/serializers'
import { ApiError } from 'src/utils/ApiError'
import * as adminOrgRepository from './admin-org.repository'
import {
    AdminCreateOrganizationBody,
    AdminOrganizationListOutput,
    AdminOrganizationOutput,
    AdminOrganizationsQuery,
    AdminUpdateOrganizationBody,
} from './types'

const serializeOrg = (
    item: Awaited<ReturnType<typeof adminOrgRepository.findMany>>[number]
): AdminOrganizationOutput => ({
    id: serializeId(item.id)!,
    code: item.code,
    name: item.name,
    type: item.type,
    status: item.status,
    logo_url: item.logoUrl,
    description: item.description,
    faculty: item.faculty
        ? {
              id: serializeId(item.faculty.id)!,
              code: item.faculty.code,
              name: item.faculty.name,
          }
        : null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
})

export const listOrganizations =
    async (
        query?: AdminOrganizationsQuery
    ): Promise<AdminOrganizationListOutput> => {
        const items = await adminOrgRepository.findMany(query)
        return { items: items.map(serializeOrg) }
    }

export const createOrganization = async (
    body: AdminCreateOrganizationBody
): Promise<AdminOrganizationOutput> => {
    const existing = await adminOrgRepository.findByCode(body.code)
    if (existing) {
        throw new ApiError(HttpStatus.CONFLICT, 'Mã tổ chức đã tồn tại')
    }
    const item = await adminOrgRepository.create({
        code: body.code,
        name: body.name,
        type: body.type,
        status: body.status,
        facultyId: body.faculty_id ? BigInt(body.faculty_id) : null,
        logoUrl: body.logo_url ?? null,
        description: body.description ?? null,
    })
    return serializeOrg(item as Parameters<typeof serializeOrg>[0])
}

export const updateOrganization = async (
    idRaw: string,
    body: AdminUpdateOrganizationBody
): Promise<AdminOrganizationOutput> => {
    const id = BigInt(idRaw)
    const existing = await adminOrgRepository.findById(id)
    if (!existing || existing.deletedAt) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy tổ chức')
    }
    const data: Parameters<typeof adminOrgRepository.update>[1] = {}
    if (body.code !== undefined) data.code = body.code
    if (body.name !== undefined) data.name = body.name
    if (body.type !== undefined) data.type = body.type
    if (body.status !== undefined) data.status = body.status
    if (body.faculty_id !== undefined)
        data.facultyId = body.faculty_id ? BigInt(body.faculty_id) : null
    if (body.logo_url !== undefined) data.logoUrl = body.logo_url
    if (body.description !== undefined) data.description = body.description
    const item = await adminOrgRepository.update(id, data)
    return serializeOrg(item as Parameters<typeof serializeOrg>[0])
}

export const deleteOrganization = async (idRaw: string) => {
    const id = BigInt(idRaw)
    const existing = await adminOrgRepository.findById(id)
    if (!existing || existing.deletedAt) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy tổ chức')
    }
    await adminOrgRepository.softDelete(id)
}
