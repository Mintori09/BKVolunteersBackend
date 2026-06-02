import { HttpStatus } from 'src/common/constants'
import { serializeId } from 'src/common/serializers'
import { ApiError } from 'src/utils/ApiError'
import * as organizationsRepository from './organizations.repository'
import {
    OrganizationDetailOutput,
    OrganizationListItemOutput,
    OrganizationListOutput,
    OrganizationListQuery,
} from './types'

const serializeOrganization = (
    item: Awaited<ReturnType<typeof organizationsRepository.findMany>>[number]
): OrganizationListItemOutput => ({
    id: serializeId(item.id)!,
    code: item.code,
    name: item.name,
    type: item.type,
    status: item.status,
    faculty: item.faculty
        ? {
              id: serializeId(item.faculty.id)!,
              code: item.faculty.code,
              name: item.faculty.name,
          }
        : null,
})

export const listOrganizations = async (
    query: OrganizationListQuery
): Promise<OrganizationListOutput> => {
    const items = await organizationsRepository.findMany(query)
    return {
        items: items.map(serializeOrganization),
    }
}

export const getOrganizationBySlug = async (
    slug: string
): Promise<OrganizationDetailOutput> => {
    const org = await organizationsRepository.findBySlug(slug)
    if (!org) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy tổ chức')
    }
    return {
        id: serializeId(org.id)!,
        code: org.code,
        name: org.name,
        type: org.type,
        status: org.status,
        logo_url: org.logoUrl,
        description: org.description,
        faculty: org.faculty
            ? {
                  id: serializeId(org.faculty.id)!,
                  code: org.faculty.code,
                  name: org.faculty.name,
              }
            : null,
        campaigns: org.campaigns.map((c) => ({
            id: serializeId(c.id)!,
            title: c.title,
            slug: c.slug,
            summary: c.summary,
            status: c.status,
            cover_image_url: c.coverImageUrl,
            start_at: c.startAt,
            end_at: c.endAt,
        })),
    }
}
