import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import { serializeId, serializePagination } from 'src/common/serializers'
import type { JwtPayload } from 'jsonwebtoken'
import * as campaignRepository from './campaign.repository'
import {
    CampaignQuery,
    CampaignStatus,
    CampaignModuleType,
    CreateCampaignInput,
    CreateCampaignModuleInput,
    UpdateCampaignInput,
    UpdateCampaignModuleInput,
} from './types'

const APPROVER_ROLES = new Set(['DOANTRUONG', 'LCD'])
const EDITABLE_STATUSES = new Set<CampaignStatus>(['DRAFT', 'REVISION_REQUIRED'])

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

    if (payload.role === 'DOANTRUONG' || payload.role === 'LCD') {
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

const ensureOrganizationActive = (
    organization:
        | {
              id?: bigint
              status?: string | null
              name?: string | null
          }
        | null
        | undefined
) => {
    if (!organization) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy tổ chức')
    }
    if (organization.status !== 'ACTIVE') {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Tổ chức đang ngưng hoạt động, không thể thao tác chiến dịch'
        )
    }
}

const ensureCanCreateForOrganization = (
    principal: JwtPayload,
    organizationId: number
) => {
    if (
        principal.role !== 'DOANTRUONG' &&
        principal.role !== 'LCD' &&
        principal.organizationId &&
        Number(principal.organizationId) !== organizationId
    ) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Không có quyền tạo chiến dịch cho tổ chức khác'
        )
    }
}

const moduleTypeToApi = (type: string) => {
    switch (type) {
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
            return type.toLowerCase()
    }
}

const moduleTypeFromApi = (
    type: CreateCampaignModuleInput['type']
): CampaignModuleType => {
    switch (type) {
        case 'fundraising':
            return 'fundraising' as CampaignModuleType
        case 'item_donation':
            return 'item_donation' as CampaignModuleType
        case 'event':
            return 'event' as CampaignModuleType
        default:
            return type
    }
}

const slugify = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

const ensureCampaignScopeValid = (
    scopeType: string,
    facultyId?: number | null
) => {
    if (scopeType === 'FACULTY' && !facultyId) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Chiến dịch phạm vi khoa phải có faculty_id'
        )
    }
}

const ensureModuleConfigReady = (module: {
    type: string
    title: string
    settingsJson: unknown
    startAt: Date
    endAt: Date
}) => {
    const settings =
        module.settingsJson && typeof module.settingsJson === 'object'
            ? (module.settingsJson as Record<string, unknown>)
            : {}

    if (module.startAt.getTime() > module.endAt.getTime()) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            `Hạng mục ${module.title} có thời gian không hợp lệ`
        )
    }

    switch (module.type) {
        case 'FUNDRAISING':
        case 'fundraising':
            if (Number(settings.target_amount ?? 0) <= 0) {
                throw new ApiError(
                    HttpStatus.CONFLICT,
                    `Hạng mục ${module.title} chưa có mục tiêu gây quỹ hợp lệ`
                )
            }
            break
        case 'ITEM_DONATION':
        case 'item_donation':
            if (
                !String(settings.receiver_address ?? '').trim() ||
                !String(settings.receiver_contact ?? '').trim()
            ) {
                throw new ApiError(
                    HttpStatus.CONFLICT,
                    `Hạng mục ${module.title} chưa đủ cấu hình tiếp nhận hiện vật`
                )
            }
            break
        case 'EVENT':
        case 'event':
            if (
                !String(settings.location ?? '').trim() ||
                Number(settings.quota ?? 0) <= 0
            ) {
                throw new ApiError(
                    HttpStatus.CONFLICT,
                    `Hạng mục ${module.title} chưa đủ cấu hình sự kiện`
                )
            }
            break
        default:
            break
    }
}

const normalizeCreateModuleInput = (
    input: CreateCampaignModuleInput
): CreateCampaignModuleInput => ({
    ...input,
    type: moduleTypeFromApi(input.type),
    settings_json: input.settings_json ?? input.settings,
})

const normalizeUpdateModuleInput = (
    input: UpdateCampaignModuleInput
): UpdateCampaignModuleInput => ({
    ...input,
    settings_json: input.settings_json ?? input.settings,
})

const buildUniqueSlug = async (title: string, preferredSlug?: string) => {
    const base = slugify(preferredSlug || title) || `campaign-${Date.now()}`
    let slug = base
    let index = 1

    while (await campaignRepository.findCampaignBySlug(slug)) {
        slug = `${base}-${index}`
        index += 1
    }

    return slug
}

const serializeModule = (module: any) => ({
    id: serializeId(module.id),
    campaign_id: serializeId(module.campaignId),
    type: moduleTypeToApi(module.type),
    title: module.title,
    description: module.description,
    start_at: module.startAt,
    end_at: module.endAt,
    status: module.status,
    settings: module.settingsJson,
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
    module_types: Array.isArray(campaign.modules)
        ? Array.from(
              new Set(
                  campaign.modules.map((module: any) =>
                      moduleTypeToApi(module.type)
                  )
              )
          )
        : [],
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
              role: normalizeOperatorRole(campaign.creator.role),
          }
        : null,
    approved_by: campaign.approver
        ? {
              id: serializeId(campaign.approver.id),
              full_name: campaign.approver.fullName,
              email: campaign.approver.email,
              role: normalizeOperatorRole(campaign.approver.role),
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

    ensureCanCreateForOrganization(principal, organizationId)
    ensureCampaignScopeValid(input.scope_type, input.faculty_id)
    const organization =
        await campaignRepository.findOrganizationById(organizationId)
    ensureOrganizationActive(organization)
    const slug = await buildUniqueSlug(input.title, input.slug)

    const campaign = await campaignRepository.createCampaign({
        ...input,
        slug,
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
    if (query.module_type) {
        where.modules = {
            some: { type: moduleTypeFromApi(query.module_type) },
        }
    }
    if (query.q) {
        where.OR = [
            { title: { contains: query.q } },
            { summary: { contains: query.q } },
            { slug: { contains: query.q } },
            { organization: { name: { contains: query.q } } },
        ]
    }
    if (query.organization_id) where.organizationId = BigInt(query.organization_id)
    if (query.faculty_id) where.facultyId = BigInt(query.faculty_id)

    if (principal.role !== 'DOANTRUONG' && principal.role !== 'LCD' && principal.organizationId) {
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

    ensureOrganizationActive(ownedCampaign.organization)
    ensureDraftLike(ownedCampaign.status)
    if (input.scope_type) {
        ensureCampaignScopeValid(input.scope_type, input.faculty_id)
    }
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

    ensureOrganizationActive(ownedCampaign.organization)
    if (!['DRAFT', 'REVISION_REQUIRED'].includes(ownedCampaign.status)) {
        throw new ApiError(HttpStatus.CONFLICT, 'Trạng thái không cho phép submit')
    }

    if (!ownedCampaign.modules.length) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chiến dịch phải có ít nhất một hạng mục trước khi gửi duyệt'
        )
    }

    ownedCampaign.modules.forEach((module) => {
        if (
            module.startAt.getTime() < ownedCampaign.startAt.getTime() ||
            module.endAt.getTime() > ownedCampaign.endAt.getTime()
        ) {
            throw new ApiError(
                HttpStatus.CONFLICT,
                `Hạng mục ${module.title} phải nằm trong thời gian chiến dịch`
            )
        }

        ensureModuleConfigReady(module)
    })

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

export const preApproveCampaign = async (
    campaignId: string,
    comment: string | undefined,
    payload?: JwtPayload | null
) => {
    const principal = assertApprover(payload)
    const campaign = await campaignRepository.findCampaignById(campaignId)

    if (!campaign) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy chiến dịch')
    }

    if (campaign.status !== 'SUBMITTED') {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chỉ có thể phê duyệt sơ bộ chiến dịch ở trạng thái SUBMITTED'
        )
    }

    return transition(
        campaignId,
        principal,
        'PRE_APPROVED',
        'CAMPAIGN_PRE_APPROVED',
        comment
    )
}

export const rejectCampaign = async (
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
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Trạng thái không cho phép từ chối'
        )
    }

    return transition(campaignId, principal, 'REJECTED', 'CAMPAIGN_REJECTED', comment)
}

export const publishCampaign = async (
    campaignId: string,
    payload?: JwtPayload | null
) => {
    const principal = assertOperator(payload)
    const campaign = await campaignRepository.findCampaignById(campaignId)
    const ownedCampaign = assertOwnerScope(campaign, principal)

    ensureOrganizationActive(ownedCampaign.organization)
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

    ensureOrganizationActive(ownedCampaign.organization)
    if (!['PUBLISHED', 'ONGOING'].includes(ownedCampaign.status)) {
        throw new ApiError(HttpStatus.CONFLICT, 'Trạng thái không cho phép kết thúc')
    }

    return transition(campaignId, principal, 'ENDED', 'CAMPAIGN_ENDED')
}

export const deleteCampaign = async (
    campaignId: string,
    payload?: JwtPayload | null
) => {
    const principal = assertOperator(payload)
    const campaign = await campaignRepository.findCampaignById(campaignId)
    const ownedCampaign = assertOwnerScope(campaign, principal)

    ensureOrganizationActive(ownedCampaign.organization)
    ensureDraftLike(ownedCampaign.status)
    await campaignRepository.softDeleteCampaign(campaignId)

    await Promise.all([
        campaignRepository.createActivity({
            campaignId: ownedCampaign.id,
            actorId: BigInt(principal.userId),
            activityType: 'CAMPAIGN_SOFT_DELETED',
            dataJson: { status: ownedCampaign.status },
        }),
        campaignRepository.createAuditLog({
            actorId: BigInt(principal.userId),
            action: 'CAMPAIGN_SOFT_DELETED',
            entityId: ownedCampaign.id,
            beforeJson: {
                status: ownedCampaign.status,
                deleted_at: null,
            },
            afterJson: {
                status: ownedCampaign.status,
                deleted_at: true,
            },
        }),
    ])
}

export const createCampaignModule = async (
    campaignId: string,
    input: CreateCampaignModuleInput,
    payload?: JwtPayload | null
) => {
    const principal = assertOperator(payload)
    const campaign = await campaignRepository.findCampaignById(campaignId)
    const ownedCampaign = assertOwnerScope(campaign, principal)

    ensureOrganizationActive(ownedCampaign.organization)
    ensureDraftLike(ownedCampaign.status)
    const normalizedInput = normalizeCreateModuleInput(input)
    const module = await campaignRepository.createModule(campaignId, normalizedInput)

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

    ensureOrganizationActive(ownedCampaign.organization)
    ensureDraftLike(ownedCampaign.status)
    const module = await campaignRepository.findModuleById(campaignId, moduleId)

    if (!module) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy module')
    }

    const normalizedInput = normalizeUpdateModuleInput(input)
    const updated = await campaignRepository.updateModule(campaignId, moduleId, normalizedInput)

    await campaignRepository.createActivity({
        campaignId: ownedCampaign.id,
        actorId: BigInt(principal.userId),
        activityType: 'CAMPAIGN_MODULE_UPDATED',
        dataJson: { moduleId: Number(updated.id), type: updated.type },
    })

    return serializeModule(updated)
}
