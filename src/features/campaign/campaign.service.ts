import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import { serializeId, serializePagination } from 'src/common/serializers'
import type { JwtPayload } from 'jsonwebtoken'
import * as campaignRepository from './campaign.repository'
import {
    CampaignQuery,
    CampaignStatus,
    CreateCampaignInput,
    CreateCampaignModuleInput,
    UpdateCampaignInput,
    UpdateCampaignModuleInput,
} from './types'

const APPROVER_ROLES = new Set(['SCHOOL_ADMIN', 'SCHOOL_REVIEWER'])
const EDITABLE_STATUSES = new Set<CampaignStatus>(['DRAFT', 'REVISION_REQUIRED'])

const assertOperator = (payload?: JwtPayload | null) => {
    if (!payload?.userId || payload.accountType !== 'OPERATOR') {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản operator')
    }

    return payload
}

const assertApprover = (payload?: JwtPayload | null) => {
    const principal = assertOperator(payload)
    if (!APPROVER_ROLES.has(principal.role)) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Không có quyền duyệt chiến dịch')
    }
    return principal
}

const assertOwnerScope = (campaign: Awaited<ReturnType<typeof campaignRepository.findCampaignById>>, payload: JwtPayload) => {
    if (!campaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy chiến dịch')
    }

    if (payload.role === 'SCHOOL_ADMIN' || payload.role === 'SCHOOL_REVIEWER') {
        return campaign
    }

    if (payload.organizationId && String(campaign.organizationId) === payload.organizationId) {
        return campaign
    }

    throw new ApiError(HttpStatus.FORBIDDEN, 'Không có quyền thao tác chiến dịch này')
}

const ensureDraftLike = (status: string) => {
    if (!EDITABLE_STATUSES.has(status as CampaignStatus)) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chiến dịch không ở trạng thái cho phép chỉnh sửa'
        )
    }
}

const serializeModule = (module: any) => ({
    id: serializeId(module.id),
    campaign_id: serializeId(module.campaignId),
    type: module.type,
    title: module.title,
    description: module.description,
    start_at: module.startAt,
    end_at: module.endAt,
    status: module.status,
    settings_json: module.settingsJson,
    created_at: module.createdAt,
    updated_at: module.updatedAt,
})

const serializeReview = (review: any) => ({
    id: serializeId(review.id),
    campaign_id: serializeId(review.campaignId),
    module_id: serializeId(review.moduleId),
    author_type: review.authorType,
    author_id: serializeId(review.authorId),
    body: review.body,
    visibility: review.visibility,
    attachment_url: review.attachmentUrl,
    created_at: review.createdAt,
    updated_at: review.updatedAt,
})

const serializeCampaign = (campaign: any) => ({
    id: serializeId(campaign.id),
    organization_id: serializeId(campaign.organizationId),
    title: campaign.title,
    slug: campaign.slug,
    summary: campaign.summary,
    description: campaign.description,
    cover_image_url: campaign.coverImageUrl,
    beneficiary: campaign.beneficiary,
    scope_type: campaign.scopeType,
    faculty_id: serializeId(campaign.facultyId),
    start_at: campaign.startAt,
    end_at: campaign.endAt,
    status: campaign.status,
    published_at: campaign.publishedAt,
    approved_at: campaign.approvedAt,
    created_at: campaign.createdAt,
    updated_at: campaign.updatedAt,
    organization: campaign.organization
        ? {
              id: serializeId(campaign.organization.id),
              code: campaign.organization.code,
              name: campaign.organization.name,
              type: campaign.organization.type,
              faculty_id: serializeId(campaign.organization.facultyId),
          }
        : null,
    faculty: campaign.faculty
        ? {
              id: serializeId(campaign.faculty.id),
              code: campaign.faculty.code,
              name: campaign.faculty.name,
          }
        : null,
    created_by: campaign.creator
        ? {
              id: serializeId(campaign.creator.id),
              full_name: campaign.creator.fullName,
              email: campaign.creator.email,
              role: campaign.creator.role,
          }
        : null,
    approved_by: campaign.approver
        ? {
              id: serializeId(campaign.approver.id),
              full_name: campaign.approver.fullName,
              email: campaign.approver.email,
              role: campaign.approver.role,
          }
        : null,
    modules: Array.isArray(campaign.modules)
        ? campaign.modules.map(serializeModule)
        : [],
    reviews: Array.isArray(campaign.reviews)
        ? campaign.reviews.map(serializeReview)
        : [],
})

const transition = async (
    campaignId: string,
    payload: JwtPayload,
    nextStatus: CampaignStatus,
    action: string,
    comment?: string
) => {
    const campaign = await campaignRepository.findCampaignById(campaignId)
    const ownedCampaign = assertOwnerScope(campaign, payload)

    if (comment) {
        await campaignRepository.createReview({
            campaignId: ownedCampaign.id,
            authorId: BigInt(payload.userId),
            body: comment,
        })
    }

    const updated = await campaignRepository.transitionCampaign(campaignId, {
        status: nextStatus,
        approvedBy: APPROVER_ROLES.has(payload.role)
            ? BigInt(payload.userId)
            : undefined,
        approvedAt: APPROVER_ROLES.has(payload.role) ? new Date() : undefined,
        publishedAt: nextStatus === 'PUBLISHED' ? new Date() : undefined,
    })

    await Promise.all([
        campaignRepository.createActivity({
            campaignId: ownedCampaign.id,
            actorId: BigInt(payload.userId),
            activityType: action,
            message: comment,
            dataJson: { status: nextStatus },
        }),
        campaignRepository.createAuditLog({
            actorId: BigInt(payload.userId),
            action,
            entityId: ownedCampaign.id,
            beforeJson: { status: ownedCampaign.status },
            afterJson: { status: nextStatus, comment },
        }),
    ])

    return serializeCampaign(updated)
}

export const createCampaign = async (
    input: CreateCampaignInput,
    payload?: JwtPayload | null
) => {
    const principal = assertOperator(payload)
    const organizationId = input.organization_id ?? Number(principal.organizationId)

    if (!organizationId) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Thiếu organization_id')
    }

    const campaign = await campaignRepository.createCampaign({
        ...input,
        organizationId: BigInt(organizationId),
        createdBy: BigInt(principal.userId),
    })

    await Promise.all([
        campaignRepository.createActivity({
            campaignId: campaign.id,
            actorId: BigInt(principal.userId),
            activityType: 'CAMPAIGN_CREATED',
        }),
        campaignRepository.createAuditLog({
            actorId: BigInt(principal.userId),
            action: 'CAMPAIGN_CREATED',
            entityId: campaign.id,
            afterJson: { status: campaign.status },
        }),
    ])

    return serializeCampaign(campaign)
}

export const getCampaigns = async (
    query: CampaignQuery,
    payload?: JwtPayload | null
) => {
    const principal = assertOperator(payload)
    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 10)
    const where: any = { deletedAt: null }

    if (query.status) where.status = query.status
    if (query.scope_type) where.scopeType = query.scope_type
    if (query.organization_id) where.organizationId = BigInt(query.organization_id)
    if (query.faculty_id) where.facultyId = BigInt(query.faculty_id)

    if (principal.role !== 'SCHOOL_ADMIN' && principal.role !== 'SCHOOL_REVIEWER' && principal.organizationId) {
        where.organizationId = BigInt(principal.organizationId)
    }

    const result = await campaignRepository.findCampaigns({ where, page, limit })

    return serializePagination(
        result.items.map(serializeCampaign),
        result.meta
    )
}

export const getCampaignById = async (
    campaignId: string,
    payload?: JwtPayload | null
) => {
    const principal = assertOperator(payload)
    const campaign = await campaignRepository.findCampaignById(campaignId)
    return serializeCampaign(assertOwnerScope(campaign, principal))
}

export const updateCampaign = async (
    campaignId: string,
    input: UpdateCampaignInput,
    payload?: JwtPayload | null
) => {
    const principal = assertOperator(payload)
    const campaign = await campaignRepository.findCampaignById(campaignId)
    const ownedCampaign = assertOwnerScope(campaign, principal)

    ensureDraftLike(ownedCampaign.status)
    const updated = await campaignRepository.updateCampaign(campaignId, input)

    await campaignRepository.createAuditLog({
        actorId: BigInt(principal.userId),
        action: 'CAMPAIGN_UPDATED',
        entityId: ownedCampaign.id,
        beforeJson: { status: ownedCampaign.status },
        afterJson: { status: updated.status },
    })

    return serializeCampaign(updated)
}

export const submitCampaignForReview = async (
    campaignId: string,
    payload?: JwtPayload | null
) => {
    const principal = assertOperator(payload)
    const campaign = await campaignRepository.findCampaignById(campaignId)
    const ownedCampaign = assertOwnerScope(campaign, principal)

    if (!['DRAFT', 'REVISION_REQUIRED'].includes(ownedCampaign.status)) {
        throw new ApiError(HttpStatus.CONFLICT, 'Trạng thái không cho phép submit')
    }

    return transition(campaignId, principal, 'SUBMITTED', 'CAMPAIGN_SUBMITTED')
}

export const requestRevision = async (
    campaignId: string,
    comment: string,
    payload?: JwtPayload | null
) => {
    const principal = assertApprover(payload)
    const campaign = await campaignRepository.findCampaignById(campaignId)

    if (!campaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy chiến dịch')
    }
    if (!['SUBMITTED', 'PRE_APPROVED'].includes(campaign.status)) {
        throw new ApiError(HttpStatus.CONFLICT, 'Trạng thái không cho phép yêu cầu sửa')
    }

    return transition(
        campaignId,
        principal,
        'REVISION_REQUIRED',
        'CAMPAIGN_REVISION_REQUESTED',
        comment
    )
}

export const approveCampaign = async (
    campaignId: string,
    comment: string | undefined,
    payload?: JwtPayload | null
) => {
    const principal = assertApprover(payload)
    const campaign = await campaignRepository.findCampaignById(campaignId)

    if (!campaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy chiến dịch')
    }

    if (campaign.status === 'SUBMITTED') {
        return transition(
            campaignId,
            principal,
            'PRE_APPROVED',
            'CAMPAIGN_PRE_APPROVED',
            comment
        )
    }

    if (campaign.status === 'PRE_APPROVED') {
        return transition(
            campaignId,
            principal,
            'APPROVED',
            'CAMPAIGN_APPROVED',
            comment
        )
    }

    throw new ApiError(HttpStatus.CONFLICT, 'Trạng thái không cho phép duyệt')
}

export const publishCampaign = async (
    campaignId: string,
    payload?: JwtPayload | null
) => {
    const principal = assertOperator(payload)
    const campaign = await campaignRepository.findCampaignById(campaignId)
    const ownedCampaign = assertOwnerScope(campaign, principal)

    if (ownedCampaign.status !== 'APPROVED') {
        throw new ApiError(HttpStatus.CONFLICT, 'Chỉ publish chiến dịch đã approved')
    }

    return transition(campaignId, principal, 'PUBLISHED', 'CAMPAIGN_PUBLISHED')
}

export const endCampaign = async (
    campaignId: string,
    payload?: JwtPayload | null
) => {
    const principal = assertOperator(payload)
    const campaign = await campaignRepository.findCampaignById(campaignId)
    const ownedCampaign = assertOwnerScope(campaign, principal)

    if (!['PUBLISHED', 'ONGOING'].includes(ownedCampaign.status)) {
        throw new ApiError(HttpStatus.CONFLICT, 'Trạng thái không cho phép kết thúc')
    }

    return transition(campaignId, principal, 'ENDED', 'CAMPAIGN_ENDED')
}

export const createCampaignModule = async (
    campaignId: string,
    input: CreateCampaignModuleInput,
    payload?: JwtPayload | null
) => {
    const principal = assertOperator(payload)
    const campaign = await campaignRepository.findCampaignById(campaignId)
    const ownedCampaign = assertOwnerScope(campaign, principal)

    ensureDraftLike(ownedCampaign.status)
    const module = await campaignRepository.createModule(campaignId, input)

    await campaignRepository.createActivity({
        campaignId: ownedCampaign.id,
        actorId: BigInt(principal.userId),
        activityType: 'CAMPAIGN_MODULE_CREATED',
        dataJson: { moduleId: Number(module.id), type: module.type },
    })

    return serializeModule(module)
}

export const updateCampaignModule = async (
    campaignId: string,
    moduleId: string,
    input: UpdateCampaignModuleInput,
    payload?: JwtPayload | null
) => {
    const principal = assertOperator(payload)
    const campaign = await campaignRepository.findCampaignById(campaignId)
    const ownedCampaign = assertOwnerScope(campaign, principal)

    ensureDraftLike(ownedCampaign.status)
    const module = await campaignRepository.findModuleById(campaignId, moduleId)

    if (!module) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy module')
    }

    const updated = await campaignRepository.updateModule(campaignId, moduleId, input)

    await campaignRepository.createActivity({
        campaignId: ownedCampaign.id,
        actorId: BigInt(principal.userId),
        activityType: 'CAMPAIGN_MODULE_UPDATED',
        dataJson: { moduleId: Number(updated.id), type: updated.type },
    })

    return serializeModule(updated)
}
