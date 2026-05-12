import { HttpStatus } from 'src/common/constants'
import { serializeId, serializePagination } from 'src/common/serializers'
import { ApiError } from 'src/utils/ApiError'
import * as approvalsRepository from './approvals.repository'
import { ApprovalQueueOutput, ApprovalQueueQuery } from './types'

export const getApprovalQueue = async (
    query: ApprovalQueueQuery,
    principal?: {
        accountType?: string
        role?: string
        organizationId?: string
        facultyId?: string
    }
): Promise<ApprovalQueueOutput> => {
    if (principal?.accountType !== 'OPERATOR') {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản operator')
    }

    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const where: Record<string, unknown> = {
        deletedAt: null,
        status: query.status
            ? query.status
            : { in: approvalsRepository.APPROVAL_STATUSES },
    }

    if (query.organization_id) {
        where.organizationId = BigInt(query.organization_id)
    }
    if (query.faculty_id) {
        where.facultyId = BigInt(query.faculty_id)
    }
    if (principal.role !== 'SCHOOL_ADMIN' && principal.role !== 'SCHOOL_REVIEWER') {
        if (principal.organizationId) {
            where.organizationId = BigInt(principal.organizationId)
        }
        if (principal.facultyId) {
            where.facultyId = BigInt(principal.facultyId)
        }
    }

    const [items, total] = await approvalsRepository.findApprovalQueue({
        page,
        limit,
        where,
    })

    return serializePagination(
        items.map((item) => ({
            id: serializeId(item.id)!,
            title: item.title,
            slug: item.slug,
            summary: item.summary,
            scope_type: item.scopeType,
            status: item.status,
            organization: item.organization
                ? {
                      id: serializeId(item.organization.id)!,
                      code: item.organization.code,
                      name: item.organization.name,
                      type: item.organization.type,
                  }
                : null,
            faculty: item.faculty
                ? {
                      id: serializeId(item.faculty.id)!,
                      code: item.faculty.code,
                      name: item.faculty.name,
                  }
                : null,
            created_by: item.creator
                ? {
                      id: serializeId(item.creator.id)!,
                      full_name: item.creator.fullName,
                      email: item.creator.email,
                      role: item.creator.role,
                  }
                : null,
            last_review: item.reviews[0]
                ? {
                      id: serializeId(item.reviews[0].id)!,
                      body: item.reviews[0].body,
                      author_id: serializeId(item.reviews[0].authorId)!,
                      author_type: item.reviews[0].authorType,
                      created_at: item.reviews[0].createdAt,
                  }
                : null,
            last_activity: item.activities[0]
                ? {
                      id: serializeId(item.activities[0].id)!,
                      activity_type: item.activities[0].activityType,
                      message: item.activities[0].message,
                      created_at: item.activities[0].createdAt,
                  }
                : null,
            updated_at: item.updatedAt,
        })),
        {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        }
    )
}
