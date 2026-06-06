import { catalogOrganizations } from 'src/features/catalog/catalog.data'
import * as catalogService from 'src/features/catalog/catalog.service'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import type { UserRole } from 'src/features/auth/types'

type ManagedCampaignRecord = {
    id: string
    organization_id: string
    slug: string
    title: string
    summary: string
    description?: string | null
    cover_image_url?: string | null
    beneficiary?: string | null
    scope_type: 'FACULTY' | 'SCHOOL' | 'PUBLIC'
    status:
        | 'DRAFT'
        | 'SUBMITTED'
        | 'PRE_APPROVED'
        | 'APPROVED'
        | 'REVISION_REQUIRED'
        | 'REJECTED'
        | 'PUBLISHED'
        | 'ONGOING'
        | 'ENDED'
        | 'ARCHIVED'
    start_at: string
    end_at: string
    published_at?: string | null
    organization: {
        id: string
        code: string
        name: string
        type: string
        faculty_id?: string | null
    } | null
    modules: Array<{
        id: string
        type: 'fundraising' | 'item_donation' | 'event'
        title: string
        description?: string | null
        status:
            | 'DRAFT'
            | 'READY'
            | 'APPROVED'
            | 'OPEN'
            | 'CLOSED'
            | 'CANCELLED'
        start_at: string
        end_at: string
        settings: Record<string, unknown>
    }>
    reviews?: Array<{
        id: string
        module_id?: string | null
        body: string
        visibility: string
        attachment_url?: string | null
        created_at: string
    }>
}

type CampaignFilters = {
    q?: string
    status?: string
    module_type?: string
    page?: number
    limit?: number
}

type ApprovalAction =
    | 'pre-approve'
    | 'approve'
    | 'request-revision'
    | 'reject'

let campaignCounter = 100
let moduleCounter = 100
let managedCampaignStore: ManagedCampaignRecord[] = []

const cloneCampaign = (item: ManagedCampaignRecord): ManagedCampaignRecord => ({
    ...item,
    organization: item.organization ? { ...item.organization } : null,
    modules: item.modules.map((module) => ({
        ...module,
        settings: { ...module.settings },
    })),
    reviews: item.reviews?.map((review) => ({ ...review })) ?? [],
})

const toManagedListItem = (campaign: ManagedCampaignRecord) => ({
    id: campaign.id,
    slug: campaign.slug,
    title: campaign.title,
    summary: campaign.summary,
    status: campaign.status,
    organization_id: campaign.organization_id,
    start_at: campaign.start_at,
    end_at: campaign.end_at,
    module_types: campaign.modules.map((module) => module.type),
})

const normalizeText = (value: string) => value.trim().toLowerCase()

const slugify = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || `campaign-${campaignCounter}`

const clampPage = (value?: number) => {
    if (!value || Number.isNaN(value) || value < 1) {
        return 1
    }

    return Math.floor(value)
}

const clampLimit = (value?: number) => {
    if (!value || Number.isNaN(value) || value < 1) {
        return 10
    }

    return Math.min(100, Math.floor(value))
}

const paginate = <T>(items: T[], page?: number, limit?: number) => {
    const safePage = clampPage(page)
    const safeLimit = clampLimit(limit)
    const total = items.length
    const totalPages = Math.max(1, Math.ceil(total / safeLimit))
    const start = (safePage - 1) * safeLimit

    return {
        items: items.slice(start, start + safeLimit),
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages,
        },
    }
}

const defaultOrganization = catalogOrganizations[0]

const defaultOrganizationSummary = defaultOrganization
    ? {
          id: defaultOrganization.id,
          code: defaultOrganization.code,
          name: defaultOrganization.name,
          type: defaultOrganization.type,
          faculty_id: defaultOrganization.faculty?.id ?? null,
      }
    : {
          id: '1',
          code: 'BKV',
          name: 'BK Volunteers',
          type: 'CLUB',
          faculty_id: null,
      }

const matchesFilters = (
    campaign: ManagedCampaignRecord,
    filters: CampaignFilters
) => {
    if (filters.q) {
        const normalizedQuery = normalizeText(filters.q)
        const matchesQuery = [
            campaign.title,
            campaign.summary,
            campaign.slug,
            campaign.organization?.name ?? '',
            campaign.organization?.code ?? '',
        ].some((value) => normalizeText(value).includes(normalizedQuery))

        if (!matchesQuery) {
            return false
        }
    }

    if (filters.status && campaign.status !== filters.status) {
        return false
    }

    if (
        filters.module_type &&
        !campaign.modules.some((module) => module.type === filters.module_type)
    ) {
        return false
    }

    return true
}

const findManagedCampaign = (campaignId: string) =>
    managedCampaignStore.find((item) => item.id === campaignId) ?? null

export const findManagedCampaignBySlug = (slug: string) =>
    managedCampaignStore.find((item) => item.slug === slug) ?? null

export const findManagedCampaignByModuleId = (moduleId: string) =>
    managedCampaignStore.find((campaign) =>
        campaign.modules.some((module) => module.id === moduleId)
    ) ?? null

export const resetManagedCampaignStore = () => {
    campaignCounter = 100
    moduleCounter = 100
    managedCampaignStore = []
}

export const listManagedCampaigns = (filters: CampaignFilters) => {
    const catalogPage = catalogService.listManagedCampaigns(filters)
    const mutableItems = managedCampaignStore
        .filter((campaign) => matchesFilters(campaign, filters))
        .sort(
            (left, right) =>
                new Date(right.start_at).getTime() - new Date(left.start_at).getTime()
        )
        .map(toManagedListItem)

    const combined = [...mutableItems, ...catalogPage.items]
    return paginate(combined, filters.page, filters.limit)
}

export const getManagedCampaignById = (campaignId: string) => {
    const mutable = findManagedCampaign(campaignId)
    if (mutable) {
        return cloneCampaign(mutable)
    }

    return catalogService.getManagedCampaignById(campaignId)
}

export const createManagedCampaign = (payload: {
    title: string
    summary: string
    description?: string
    scope_type: 'FACULTY' | 'SCHOOL' | 'PUBLIC'
    start_at: string
    end_at: string
}) => {
    const id = `campaign-${campaignCounter++}`
    const slug = slugify(payload.title)
    const campaign: ManagedCampaignRecord = {
        id,
        organization_id: defaultOrganizationSummary.id,
        slug,
        title: payload.title.trim(),
        summary: payload.summary.trim(),
        description: payload.description?.trim() || null,
        cover_image_url: null,
        beneficiary: null,
        scope_type: payload.scope_type,
        status: 'DRAFT',
        start_at: payload.start_at,
        end_at: payload.end_at,
        published_at: null,
        organization: { ...defaultOrganizationSummary },
        modules: [],
        reviews: [],
    }

    managedCampaignStore = [campaign, ...managedCampaignStore]

    return { id: campaign.id }
}

export const createCampaignModule = (
    campaignId: string,
    payload: {
        type: 'fundraising' | 'item_donation' | 'event'
        title: string
        description?: string
        start_at: string
        end_at: string
        settings: Record<string, unknown>
    }
) => {
    const existing = findManagedCampaign(campaignId)

    if (!existing) {
        return null
    }

    const module = {
        id: `module-${payload.type}-${moduleCounter++}`,
        type: payload.type,
        title: payload.title.trim(),
        description: payload.description?.trim() || null,
        status: 'DRAFT' as const,
        start_at: payload.start_at,
        end_at: payload.end_at,
        settings: { ...payload.settings },
    }

    const next = {
        ...existing,
        modules: [...existing.modules, module],
    }

    managedCampaignStore = managedCampaignStore.map((item) =>
        item.id === campaignId ? next : item
    )

    return { id: module.id }
}

export const submitCampaignReview = (campaignId: string) => {
    const existing = findManagedCampaign(campaignId)

    if (!existing) {
        return null
    }

    if (!['DRAFT', 'REVISION_REQUIRED'].includes(existing.status)) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chi duoc gui duyet chien dich dang o trang thai nhap hoac yeu cau chinh sua'
        )
    }

    const fromStatus = existing.status
    const next = {
        ...existing,
        status: 'SUBMITTED' as const,
    }

    managedCampaignStore = managedCampaignStore.map((item) =>
        item.id === campaignId ? next : item
    )

    return {
        id: campaignId,
        from_status: fromStatus,
        to_status: next.status,
    }
}

export const addApprovalComment = (
    campaignId: string,
    payload: {
        body: string
        visibility?: 'INTERNAL' | 'PUBLIC'
        module_id?: string
    }
) => {
    const existing = findManagedCampaign(campaignId)

    if (!existing) {
        return null
    }

    const comment = {
        id: `review-${Date.now()}`,
        module_id: payload.module_id?.trim() || null,
        body: payload.body.trim(),
        visibility: payload.visibility ?? 'PUBLIC',
        attachment_url: null,
        created_at: new Date().toISOString(),
    }

    const next = {
        ...existing,
        reviews: [...(existing.reviews ?? []), comment],
    }

    managedCampaignStore = managedCampaignStore.map((item) =>
        item.id === campaignId ? next : item
    )

    return {
        id: comment.id,
    }
}

export const transitionApproval = (
    campaignId: string,
    action: ApprovalAction,
    actorRole: UserRole,
    reason?: string
) => {
    const existing = findManagedCampaign(campaignId)

    if (!existing) {
        return null
    }

    if (actorRole !== 'DOANTRUONG') {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Chi Doan truong moi duoc phe duyet ho so chien dich'
        )
    }

    const transitionMap: Record<
        ApprovalAction,
        {
            allowedStatuses: ManagedCampaignRecord['status'][]
            nextStatus: ManagedCampaignRecord['status']
            defaultMessage: string
            visibility: 'PUBLIC' | 'INTERNAL'
        }
    > = {
        'pre-approve': {
            allowedStatuses: ['SUBMITTED'],
            nextStatus: 'PRE_APPROVED',
            defaultMessage: 'Ho so da dat yeu cau so duyet',
            visibility: 'INTERNAL',
        },
        approve: {
            allowedStatuses: ['PRE_APPROVED'],
            nextStatus: 'APPROVED',
            defaultMessage: 'Ho so da duoc phe duyet',
            visibility: 'PUBLIC',
        },
        'request-revision': {
            allowedStatuses: ['SUBMITTED', 'PRE_APPROVED'],
            nextStatus: 'REVISION_REQUIRED',
            defaultMessage: 'Yeu cau don vi bo sung va chinh sua ho so',
            visibility: 'PUBLIC',
        },
        reject: {
            allowedStatuses: ['SUBMITTED', 'PRE_APPROVED'],
            nextStatus: 'REJECTED',
            defaultMessage: 'Ho so bi tu choi sau khi tham dinh',
            visibility: 'PUBLIC',
        },
    }

    const config = transitionMap[action]

    if (!config.allowedStatuses.includes(existing.status)) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Trang thai chien dich khong hop le cho thao tac phe duyet nay'
        )
    }

    const reviewEntry = {
        id: `review-${Date.now()}`,
        module_id: null,
        body: reason?.trim() || config.defaultMessage,
        visibility: config.visibility,
        attachment_url: null,
        created_at: new Date().toISOString(),
    }

    const next = {
        ...existing,
        status: config.nextStatus,
        reviews: [...(existing.reviews ?? []), reviewEntry],
    }

    managedCampaignStore = managedCampaignStore.map((item) =>
        item.id === campaignId ? next : item
    )

    return {
        campaign_id: campaignId,
        from_status: existing.status,
        to_status: next.status,
    }
}

export const publishCampaign = (campaignId: string, actorRole: UserRole) => {
    const existing = findManagedCampaign(campaignId)

    if (!existing) {
        return null
    }

    if (!['LCD', 'CLB'].includes(actorRole)) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Chi don vi tao chien dich moi duoc cong khai chien dich'
        )
    }

    if (existing.status !== 'APPROVED') {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chi duoc cong khai chien dich sau khi Doan truong phe duyet'
        )
    }

    const next = {
        ...existing,
        status: 'PUBLISHED' as const,
        published_at: new Date().toISOString(),
    }

    managedCampaignStore = managedCampaignStore.map((item) =>
        item.id === campaignId ? next : item
    )

    return {
        id: campaignId,
        status: next.status,
    }
}

export const deleteCampaign = (campaignId: string) => {
    const existing = findManagedCampaign(campaignId)

    if (!existing) {
        return false
    }

    managedCampaignStore = managedCampaignStore.filter(
        (item) => item.id !== campaignId
    )

    return true
}

export const listManagedApprovalQueue = (filters: CampaignFilters) => {
    return managedCampaignStore
        .filter((campaign) =>
            ['SUBMITTED', 'PRE_APPROVED'].includes(campaign.status)
        )
        .filter((campaign) => matchesFilters(campaign, filters))
        .sort(
            (left, right) =>
                new Date(right.start_at).getTime() - new Date(left.start_at).getTime()
        )
        .map((campaign) => ({
            id: campaign.id,
            slug: campaign.slug,
            title: campaign.title,
            summary: campaign.summary,
            status: campaign.status,
            organization: campaign.organization
                ? {
                      id: campaign.organization.id,
                      code: campaign.organization.code,
                      name: campaign.organization.name,
                      type: campaign.organization.type,
                  }
                : {
                      id: campaign.organization_id,
                      code: '',
                      name: 'Unknown organization',
                      type: 'UNKNOWN',
                  },
            module_types: campaign.modules.map((module) => module.type),
            submitted_at: campaign.reviews?.at(-1)?.created_at ?? campaign.start_at,
        }))
}

export const getManagedApprovalCampaignDetail = (campaignId: string) => {
    const existing = findManagedCampaign(campaignId)

    if (!existing) {
        return null
    }

    if (
        ![
            'SUBMITTED',
            'PRE_APPROVED',
            'APPROVED',
            'REVISION_REQUIRED',
            'REJECTED',
            'PUBLISHED',
            'ONGOING',
            'ENDED',
        ].includes(existing.status)
    ) {
        return null
    }

    return cloneCampaign(existing)
}
