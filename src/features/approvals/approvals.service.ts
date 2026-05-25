import { HttpStatus } from 'src/common/constants'
import { serializeId, serializePagination } from 'src/common/serializers'
import { ApiError } from 'src/utils/ApiError'
import * as approvalsRepository from './approvals.repository'
import * as campaignRepository from 'src/features/campaign/campaign.repository'
import { ApprovalQueueOutput, ApprovalQueueQuery } from './types'
import type { JwtPayload } from 'jsonwebtoken'

const normalizeOperatorRole = (role: string | null | undefined) => {
    switch (role) {
        case 'ORG_ADMIN':
        case 'CLB':
            return 'CLB'
        case 'SCHOOL_REVIEWER':
        case 'LCD':
            return 'LCD'
        case 'SCHOOL_ADMIN':
        case 'DOANTRUONG':
            return 'DOANTRUONG'
        default:
            return role ?? 'CLB'
    }
}

const moduleTypeToApi = (value: string) => {
    switch (value) {
        case 'FUNDRAISING':
        case 'fundraising':
            return 'fundraising'
        case 'ITEM_DONATION':
        case 'item_donation':
            return 'item_donation'
        case 'EVENT':
        case 'event':
            return 'event'
        default:
            return value.toLowerCase()
    }
}

const moduleTypeFromApi = (value: string) => {
    switch (value) {
        case 'fundraising':
            return 'fundraising'
        case 'item_donation':
            return 'item_donation'
        case 'event':
            return 'event'
        default:
            return value.toLowerCase()
    }
}

export const addApprovalComment = async (
    campaignId: string,
    body: { body: string; visibility?: string; module_id?: string },
    payload?: JwtPayload | null
) => {
    if (!payload?.userId) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chưa xác thực')
    }

    return campaignRepository.createReview({
        campaignId: BigInt(campaignId),
        moduleId: body.module_id ? BigInt(body.module_id) : null,
        authorId: BigInt(payload.userId),
        authorType: payload.accountType === 'STUDENT' ? 'STUDENT' : 'OPERATOR',
        body: body.body,
        visibility: body.visibility ?? 'INTERNAL',
    })
}

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
    if (query.module_type) {
        where.modules = {
            some: { type: moduleTypeFromApi(query.module_type) },
        }
    }
    if (query.q) {
        where.OR = [
            { title: { contains: query.q } },
            { summary: { contains: query.q } },
            { organization: { name: { contains: query.q } } },
        ]
    }
    if (principal.role !== 'DOANTRUONG' && principal.role !== 'LCD') {
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
            module_types: item.modules?.map((module) => moduleTypeToApi(module.type)) ?? [],
            submitted_at: item.updatedAt,
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
                      role: normalizeOperatorRole(item.creator.role),
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
