import { serializeId } from 'src/common/serializers'
import * as organizationsRepository from './organizations.repository'
import {
    OrganizationListItemOutput,
    OrganizationListOutput,
    OrganizationListQuery,
} from './types'

const serializeOrganization = (item: Awaited<
    ReturnType<typeof organizationsRepository.findMany>
>[number]): OrganizationListItemOutput => ({
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
