import {
    catalogApprovals,
    catalogCampaigns,
    catalogOrganizations,
    catalogStudentActivities,
    catalogStudentDonations,
} from './catalog.data'
import {
    CatalogApproval,
    CatalogCampaign,
    CatalogCampaignModule,
    CatalogCampaignStatus,
    CatalogModuleType,
    CatalogOrganization,
    CatalogStudentActivity,
    CatalogStudentDonation,
} from './catalog.types'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'

type CampaignFilters = {
    q?: string
    status?: string
    module_type?: string
    organization_id?: string
    page?: number
    limit?: number
}

type OverviewFilters = {
    from?: string
    to?: string
    organization_id?: string
    module_type?: string
    status?: string
}

const PUBLIC_STATUSES: CatalogCampaignStatus[] = ['PUBLISHED', 'ONGOING']

type MutableCatalogOrganization = CatalogOrganization & {
    created_at: string
}

type AdminOrganizationFilters = {
    q?: string
    type?: string
    status?: string
}

type AdminOrganizationInput = {
    code?: string
    name?: string
    type?: string
    status?: string
    faculty_id?: string
    description?: string
}

let organizationStore: MutableCatalogOrganization[] = catalogOrganizations.map(
    (organization, index) => ({
        ...organization,
        created_at: new Date(Date.UTC(2026, 0, index + 5)).toISOString(),
    })
)

const normalizeText = (value: string) => value.trim().toLowerCase()

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

const getOrganizationMap = () =>
    new Map(organizationStore.map((organization) => [organization.id, organization]))

const slugify = (value: string) =>
    value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

const ensureUniqueOrganization = (
    nextOrganization: AdminOrganizationInput,
    excludeId?: string
) => {
    const code = nextOrganization.code?.trim().toLowerCase()
    const name = nextOrganization.name?.trim().toLowerCase()

    if (code) {
        const duplicateCode = organizationStore.find(
            (organization) =>
                organization.id !== excludeId &&
                organization.code.trim().toLowerCase() === code
        )

        if (duplicateCode) {
            throw new ApiError(HttpStatus.CONFLICT, 'Ma don vi da ton tai')
        }
    }

    if (name) {
        const duplicateName = organizationStore.find(
            (organization) =>
                organization.id !== excludeId &&
                organization.name.trim().toLowerCase() === name
        )

        if (duplicateName) {
            throw new ApiError(HttpStatus.CONFLICT, 'Ten don vi da ton tai')
        }
    }
}

const buildOrganizationSlug = (name: string, excludeId?: string) => {
    const baseSlug = slugify(name) || 'don-vi-moi'
    let nextSlug = baseSlug
    let counter = 2

    while (
        organizationStore.some(
            (organization) =>
                organization.id !== excludeId && organization.slug === nextSlug
        )
    ) {
        nextSlug = `${baseSlug}-${counter}`
        counter += 1
    }

    return nextSlug
}

const toAdminOrganization = (organization: MutableCatalogOrganization) => ({
    ...organization,
})

const toPublicProgress = (modules: CatalogCampaignModule[]) => {
    if (modules.length === 0) {
        return {
            percent: 0,
            modules: [],
        }
    }

    const moduleProgress = modules.map((module) => ({
        type: module.type,
        current: module.progress.current,
        target: module.progress.target,
        percent: module.progress.percent,
    }))

    const percent = Math.round(
        moduleProgress.reduce((total, module) => total + module.percent, 0) /
            moduleProgress.length
    )

    return {
        percent,
        modules: moduleProgress,
    }
}

const toOrganizationSummary = (organization: CatalogOrganization) => ({
    id: organization.id,
    code: organization.code,
    name: organization.name,
    type: organization.type,
    logo_url: organization.logo_url,
})

const toPublicCampaignCard = (campaign: CatalogCampaign) => {
    const organizations = getOrganizationMap()
    const organization = organizations.get(campaign.organization_id)

    return {
        id: campaign.id,
        slug: campaign.slug,
        title: campaign.title,
        summary: campaign.summary,
        cover_image_url: campaign.cover_image_url,
        organization: organization
            ? toOrganizationSummary(organization)
            : {
                  id: campaign.organization_id,
                  code: '',
                  name: 'Unknown organization',
                  type: 'UNKNOWN',
                  logo_url: null,
              },
        module_types: campaign.module_types,
        status: campaign.status === 'ONGOING' ? 'ONGOING' : 'PUBLISHED',
        start_at: campaign.start_at,
        end_at: campaign.end_at,
        progress: toPublicProgress(campaign.modules),
    }
}

const toManagedCampaignItem = (campaign: CatalogCampaign) => ({
    id: campaign.id,
    slug: campaign.slug,
    title: campaign.title,
    summary: campaign.summary,
    status: campaign.status,
    organization_id: campaign.organization_id,
    start_at: campaign.start_at,
    end_at: campaign.end_at,
    module_types: campaign.module_types,
})

const toManagedCampaignDetail = (campaign: CatalogCampaign) => {
    const organizations = getOrganizationMap()
    const organization = organizations.get(campaign.organization_id)

    return {
        id: campaign.id,
        organization_id: campaign.organization_id,
        slug: campaign.slug,
        title: campaign.title,
        summary: campaign.summary,
        description: campaign.description,
        cover_image_url: campaign.cover_image_url,
        beneficiary: campaign.beneficiary,
        scope_type: campaign.scope_type,
        status: campaign.status,
        start_at: campaign.start_at,
        end_at: campaign.end_at,
        published_at: campaign.published_at,
        organization: organization
            ? {
                  id: organization.id,
                  code: organization.code,
                  name: organization.name,
                  type: organization.type,
                  faculty_id: organization.faculty?.id ?? null,
              }
            : null,
        modules: campaign.modules.map((module) => ({
            id: module.id,
            type: module.type,
            title: module.title,
            description: module.description,
            status: module.status,
            start_at: module.start_at,
            end_at: module.end_at,
            settings: { ...module.settings },
        })),
        reviews: campaign.reviews.map((review) => ({ ...review })),
    }
}

const matchesQuery = (campaign: CatalogCampaign, q?: string) => {
    if (!q) {
        return true
    }

    const organizations = getOrganizationMap()
    const organization = organizations.get(campaign.organization_id)
    const normalizedQuery = normalizeText(q)

    return [
        campaign.title,
        campaign.summary,
        campaign.slug,
        organization?.name ?? '',
        organization?.code ?? '',
    ].some((value) => normalizeText(value).includes(normalizedQuery))
}

const matchesModuleType = (campaign: CatalogCampaign, moduleType?: string) => {
    if (!moduleType) {
        return true
    }

    return campaign.module_types.includes(moduleType as CatalogModuleType)
}

const matchesStatus = (campaign: CatalogCampaign, status?: string) => {
    if (!status) {
        return true
    }

    return campaign.status === status
}

const matchesOrganization = (
    campaign: CatalogCampaign,
    organizationId?: string
) => {
    if (!organizationId) {
        return true
    }

    return campaign.organization_id === organizationId
}

const matchesDateWindow = (
    campaign: CatalogCampaign,
    from?: string,
    to?: string
) => {
    const startAt = new Date(campaign.start_at).getTime()
    const endAt = new Date(campaign.end_at).getTime()
    const fromTime = from ? new Date(from).getTime() : null
    const toTime = to ? new Date(to).getTime() : null

    if (fromTime && Number.isFinite(fromTime) && endAt < fromTime) {
        return false
    }

    if (toTime && Number.isFinite(toTime) && startAt > toTime) {
        return false
    }

    return true
}

export const listPublicCampaigns = (filters: CampaignFilters) => {
    const filtered = catalogCampaigns
        .filter((campaign) => PUBLIC_STATUSES.includes(campaign.status))
        .filter((campaign) => matchesQuery(campaign, filters.q))
        .filter((campaign) => matchesModuleType(campaign, filters.module_type))
        .filter((campaign) => matchesOrganization(campaign, filters.organization_id))
        .filter((campaign) => {
            if (!filters.status) {
                return true
            }

            return campaign.status === filters.status
        })
        .sort(
            (left, right) =>
                new Date(right.start_at).getTime() - new Date(left.start_at).getTime()
        )
        .map(toPublicCampaignCard)

    return paginate(filtered, filters.page, filters.limit)
}

export const getPublicCampaignBySlug = (slug: string) => {
    const campaign = catalogCampaigns.find(
        (item) => item.slug === slug && PUBLIC_STATUSES.includes(item.status)
    )

    if (!campaign) {
        return null
    }

    const publicCard = toPublicCampaignCard(campaign)

    return {
        ...publicCard,
        description: campaign.description,
        beneficiary: campaign.beneficiary,
        scope_type: campaign.scope_type,
        published_at: campaign.published_at,
        modules: campaign.modules.map((module) => ({
            id: module.id,
            type: module.type,
            title: module.title,
            description: module.description,
            status: module.status,
            start_at: module.start_at,
            end_at: module.end_at,
            settings: { ...module.settings },
            progress: {
                type: module.type,
                current: module.progress.current,
                target: module.progress.target,
                percent: module.progress.percent,
            },
            cta: { ...module.cta },
        })),
    }
}

export const listManagedCampaigns = (filters: CampaignFilters) => {
    const filtered = catalogCampaigns
        .filter((campaign) => matchesQuery(campaign, filters.q))
        .filter((campaign) => matchesModuleType(campaign, filters.module_type))
        .filter((campaign) => matchesStatus(campaign, filters.status))
        .sort(
            (left, right) =>
                new Date(right.start_at).getTime() - new Date(left.start_at).getTime()
        )
        .map(toManagedCampaignItem)

    return paginate(filtered, filters.page, filters.limit)
}

export const getManagedCampaignById = (id: string) => {
    const campaign = catalogCampaigns.find((item) => item.id === id)

    if (!campaign) {
        return null
    }

    return toManagedCampaignDetail(campaign)
}

export const listOrganizations = () => {
    return organizationStore.map((organization) => ({ ...organization }))
}

export const getOrganizationBySlug = (slug: string) => {
    const organization = organizationStore.find((item) => item.slug === slug)

    if (!organization) {
        return null
    }

    const campaigns = catalogCampaigns
        .filter(
            (campaign) =>
                campaign.organization_id === organization.id &&
                PUBLIC_STATUSES.includes(campaign.status)
        )
        .map((campaign) => ({
            id: campaign.id,
            slug: campaign.slug,
            title: campaign.title,
            summary: campaign.summary,
            status: campaign.status,
            start_at: campaign.start_at,
            end_at: campaign.end_at,
            cover_image_url: campaign.cover_image_url,
            module_types: [...campaign.module_types],
        }))

    return {
        ...organization,
        campaigns,
    }
}

const buildOrganizationBreakdown = (campaigns: CatalogCampaign[]) => {
    return organizationStore
        .map((organization) => {
            const organizationCampaigns = campaigns.filter(
                (campaign) => campaign.organization_id === organization.id
            )

            if (organizationCampaigns.length === 0) {
                return null
            }

            const totals = organizationCampaigns.reduce(
                (accumulator, campaign) => {
                    campaign.modules.forEach((module) => {
                        accumulator.verified_money_amount +=
                            module.report.verified_money_amount ?? 0
                        accumulator.received_item_quantity +=
                            module.report.received_item_quantity ?? 0
                        accumulator.completed_event_registrations +=
                            module.report.completed_registrations ?? 0
                        accumulator.completed_event_hours +=
                            module.report.completed_hours ?? 0
                    })

                    accumulator.issued_certificates += campaign.issued_certificates

                    return accumulator
                },
                {
                    verified_money_amount: 0,
                    received_item_quantity: 0,
                    completed_event_registrations: 0,
                    completed_event_hours: 0,
                    issued_certificates: 0,
                }
            )

            return {
                organization_id: Number(organization.id),
                organization_name: organization.name,
                organization_code: organization.code,
                campaign_count: organizationCampaigns.length,
                verified_money_amount: totals.verified_money_amount,
                received_item_quantity: totals.received_item_quantity,
                completed_event_registrations: totals.completed_event_registrations,
                completed_event_hours: totals.completed_event_hours,
                issued_certificates: totals.issued_certificates,
            }
        })
        .filter(Boolean)
}

const buildModuleBreakdown = (campaigns: CatalogCampaign[]) => {
    const moduleTypeMap = new Map<string, number>()

    campaigns.forEach((campaign) => {
        campaign.module_types.forEach((moduleType) => {
            moduleTypeMap.set(moduleType, (moduleTypeMap.get(moduleType) ?? 0) + 1)
        })
    })

    return Array.from(moduleTypeMap.entries()).map(([module_type, campaign_count]) => ({
        module_type,
        campaign_count,
    }))
}

const buildStatusBreakdown = (campaigns: CatalogCampaign[]) => {
    const statusMap = new Map<string, number>()

    campaigns.forEach((campaign) => {
        statusMap.set(campaign.status, (statusMap.get(campaign.status) ?? 0) + 1)
    })

    return Array.from(statusMap.entries()).map(([status, campaign_count]) => ({
        status,
        campaign_count,
    }))
}

export const getSchoolOverview = (filters: OverviewFilters) => {
    const filteredCampaigns = catalogCampaigns
        .filter((campaign) => matchesOrganization(campaign, filters.organization_id))
        .filter((campaign) => matchesModuleType(campaign, filters.module_type))
        .filter((campaign) => matchesStatus(campaign, filters.status))
        .filter((campaign) =>
            matchesDateWindow(campaign, filters.from, filters.to)
        )

    const totalMoney = filteredCampaigns.reduce((total, campaign) => {
        return (
            total +
            campaign.modules.reduce(
                (moduleTotal, module) =>
                    moduleTotal + (module.report.verified_money_amount ?? 0),
                0
            )
        )
    }, 0)

    return {
        total_campaigns: filteredCampaigns.length,
        total_students: 1280,
        total_organizations: organizationStore.length,
        total_money_donations: totalMoney,
        organization_breakdown: buildOrganizationBreakdown(filteredCampaigns),
        module_breakdown: buildModuleBreakdown(filteredCampaigns),
        status_breakdown: buildStatusBreakdown(filteredCampaigns),
        filters_applied: {
            from: filters.from,
            to: filters.to,
            organization_id: filters.organization_id
                ? Number(filters.organization_id)
                : undefined,
            module_type: filters.module_type,
            status: filters.status,
        },
    }
}

export const listAdminOrganizations = (filters: AdminOrganizationFilters) => {
    const normalizedQuery = filters.q ? normalizeText(filters.q) : ''

    return organizationStore
        .filter((organization) => {
            if (!normalizedQuery) {
                return true
            }

            return [organization.name, organization.code, organization.slug]
                .map((value) => normalizeText(value))
                .some((value) => value.includes(normalizedQuery))
        })
        .filter((organization) =>
            filters.type ? organization.type === filters.type : true
        )
        .filter((organization) =>
            filters.status ? organization.status === filters.status : true
        )
        .sort(
            (left, right) =>
                new Date(right.created_at).getTime() -
                new Date(left.created_at).getTime()
        )
        .map(toAdminOrganization)
}

export const createAdminOrganization = (input: AdminOrganizationInput) => {
    if (!input.code?.trim() || !input.name?.trim() || !input.type?.trim()) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Code, name va type la bat buoc'
        )
    }

    ensureUniqueOrganization(input)

    const nextOrganization: MutableCatalogOrganization = {
        id: `${Date.now()}`,
        code: input.code.trim(),
        name: input.name.trim(),
        type: input.type.trim(),
        slug: buildOrganizationSlug(input.name.trim()),
        logo_url: null,
        description: input.description?.trim() || null,
        faculty: input.faculty_id
            ? {
                  id: input.faculty_id,
                  name: `Faculty ${input.faculty_id}`,
              }
            : null,
        status: input.status?.trim() || 'ACTIVE',
        created_at: new Date().toISOString(),
    }

    organizationStore = [nextOrganization, ...organizationStore]

    return toAdminOrganization(nextOrganization)
}

export const updateAdminOrganization = (
    id: string,
    input: AdminOrganizationInput
) => {
    const currentOrganization = organizationStore.find(
        (organization) => organization.id === id
    )

    if (!currentOrganization) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay don vi')
    }

    ensureUniqueOrganization(input, id)

    const nextName = input.name?.trim() || currentOrganization.name
    const nextOrganization: MutableCatalogOrganization = {
        ...currentOrganization,
        code: input.code?.trim() || currentOrganization.code,
        name: nextName,
        type: input.type?.trim() || currentOrganization.type,
        status: input.status?.trim() || currentOrganization.status,
        description:
            input.description !== undefined
                ? input.description.trim() || null
                : currentOrganization.description,
        faculty:
            input.faculty_id !== undefined
                ? input.faculty_id
                    ? {
                          id: input.faculty_id,
                          name: `Faculty ${input.faculty_id}`,
                      }
                    : null
                : currentOrganization.faculty,
        slug:
            nextName !== currentOrganization.name
                ? buildOrganizationSlug(nextName, currentOrganization.id)
                : currentOrganization.slug,
    }

    organizationStore = organizationStore.map((organization) =>
        organization.id === id ? nextOrganization : organization
    )

    return toAdminOrganization(nextOrganization)
}

export const deleteAdminOrganization = (id: string) => {
    const currentOrganization = organizationStore.find(
        (organization) => organization.id === id
    )

    if (!currentOrganization) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay don vi')
    }

    const isReferencedByCampaign = catalogCampaigns.some(
        (campaign) => campaign.organization_id === id
    )

    if (isReferencedByCampaign) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Don vi dang duoc su dung trong cac chien dich'
        )
    }

    organizationStore = organizationStore.filter(
        (organization) => organization.id !== id
    )
}

export const getCampaignReport = (id: string) => {
    const campaign = catalogCampaigns.find((item) => item.id === id)

    if (!campaign) {
        return null
    }

    const fundraisingModules = campaign.modules.filter(
        (module) => module.type === 'fundraising'
    )
    const itemModules = campaign.modules.filter(
        (module) => module.type === 'item_donation'
    )
    const eventModules = campaign.modules.filter((module) => module.type === 'event')

    return {
        campaign: {
            id: Number(campaign.id.replace(/\D+/g, '')) || 0,
            title: campaign.title,
            slug: campaign.slug,
            status: campaign.status,
        },
        modules: campaign.modules.map((module) => ({
            id: Number(module.id.replace(/\D+/g, '')) || 0,
            type: module.type,
            status: module.status,
        })),
        fundraising: {
            total_verified_amount: fundraisingModules.reduce(
                (total, module) => total + (module.report.verified_money_amount ?? 0),
                0
            ),
            total_donations: fundraisingModules.reduce(
                (total, module) => total + (module.report.total_donations ?? 0),
                0
            ),
            verified_donations: fundraisingModules.reduce(
                (total, module) => total + (module.report.verified_donations ?? 0),
                0
            ),
        },
        item_donations: {
            received_quantity: itemModules.reduce(
                (total, module) => total + (module.report.received_item_quantity ?? 0),
                0
            ),
        },
        events: {
            registrations: eventModules.reduce(
                (total, module) => total + (module.report.registrations ?? 0),
                0
            ),
            completed_registrations: eventModules.reduce(
                (total, module) =>
                    total + (module.report.completed_registrations ?? 0),
                0
            ),
            completed_hours: eventModules.reduce(
                (total, module) => total + (module.report.completed_hours ?? 0),
                0
            ),
        },
        certificates: {
            issued_total: campaign.issued_certificates,
        },
    }
}

export const getCampaignReconciliation = (id: string) => {
    const campaign = catalogCampaigns.find((item) => item.id === id)
    const campaignReport = getCampaignReport(id)

    if (!campaign || !campaignReport) {
        return null
    }

    const verifiedAmount = campaignReport.fundraising.total_verified_amount
    const matchedTransactions = campaignReport.fundraising.verified_donations
    const totalTransactions = Math.max(
        matchedTransactions + 5,
        campaignReport.fundraising.total_donations
    )
    const totalTransactionAmount = verifiedAmount + 8000000

    return {
        campaign: {
            id: Number(campaign.id.replace(/\D+/g, '')) || 0,
            title: campaign.title,
            slug: campaign.slug,
            status: campaign.status,
            organization_id: Number(campaign.organization_id),
        },
        reconciliation: {
            matched_transactions: matchedTransactions,
            unmatched_transactions: totalTransactions - matchedTransactions,
            total_transaction_amount: totalTransactionAmount,
            matched_transaction_amount: verifiedAmount,
            unmatched_transaction_amount: totalTransactionAmount - verifiedAmount,
            pending_donations:
                campaignReport.fundraising.total_donations -
                campaignReport.fundraising.verified_donations,
            matched_donations: matchedTransactions,
            verified_donations: campaignReport.fundraising.verified_donations,
            rejected_donations: Math.max(
                0,
                campaignReport.fundraising.total_donations -
                    campaignReport.fundraising.verified_donations -
                    1
            ),
            verified_amount: verifiedAmount,
            amount_gap_vs_verified: totalTransactionAmount - verifiedAmount,
        },
    }
}

export const getApprovalQueue = (filters: CampaignFilters) => {
    return catalogApprovals
        .filter((approval) => !filters.status || approval.status === filters.status)
        .map((approval) => {
            const campaign = catalogCampaigns.find(
                (item) => item.id === approval.campaign_id
            )

            return campaign
                ? {
                      approval,
                      campaign,
                  }
                : null
        })
        .filter(Boolean)
        .filter((item) => {
            if (!item) {
                return false
            }

            if (!matchesQuery(item.campaign, filters.q)) {
                return false
            }

            return matchesModuleType(item.campaign, filters.module_type)
        })
        .sort(
            (left, right) =>
                new Date(right!.approval.submitted_at).getTime() -
                new Date(left!.approval.submitted_at).getTime()
        )
        .slice(0, clampLimit(filters.limit))
        .map((item) => {
            const organization = getOrganizationMap().get(item!.campaign.organization_id)

            return {
                id: item!.approval.id,
                slug: item!.campaign.slug,
                title: item!.campaign.title,
                summary: item!.campaign.summary,
                status: item!.approval.status,
                organization: organization
                    ? {
                          id: organization.id,
                          code: organization.code,
                          name: organization.name,
                          type: organization.type,
                      }
                    : {
                          id: item!.campaign.organization_id,
                          code: '',
                          name: 'Unknown organization',
                          type: 'UNKNOWN',
                      },
                module_types: [...item!.campaign.module_types],
                submitted_at: item!.approval.submitted_at,
            }
        })
}

export const getApprovalCampaignDetail = (approvalId: string) => {
    const approval = catalogApprovals.find((item) => item.id === approvalId)

    if (!approval) {
        return null
    }

    const campaign = catalogCampaigns.find((item) => item.id === approval.campaign_id)

    if (!campaign) {
        return null
    }

    return {
        ...toManagedCampaignDetail(campaign),
        id: approval.id,
        status: approval.status,
    }
}

export const getStudentActivities = (filters: {
    type?: string
    status?: string
}) => {
    return catalogStudentActivities
        .filter((item) => !filters.type || item.activity_type === filters.type)
        .filter((item) => !filters.status || item.status === filters.status)
        .map((item) => ({ ...item }))
}

export const getStudentDonations = (filters: {
    type?: string
    status?: string
}) => {
    return catalogStudentDonations
        .filter((item) => !filters.type || item.donation_type === filters.type)
        .filter((item) => !filters.status || item.status === filters.status)
        .map((item) => ({ ...item }))
}

export const getStudentDashboard = () => {
    const distinctCampaignIds = new Set(
        catalogStudentActivities
            .map((item) => item.campaign_id)
            .filter(Boolean) as string[]
    )
    const moneyDonations = catalogStudentDonations.filter(
        (item) => item.donation_type === 'money' && item.status === 'VERIFIED'
    )
    const itemDonations = catalogStudentDonations.filter(
        (item) => item.donation_type === 'item' && item.status === 'RECEIVED'
    )
    const completedEvents = catalogStudentActivities.filter(
        (item) =>
            item.activity_type === 'event_registration' && item.status === 'COMPLETED'
    )
    const certificatesCount = catalogStudentActivities.filter(
        (item) => item.activity_type === 'certificate'
    ).length

    return {
        campaigns_count: distinctCampaignIds.size,
        money_amount: moneyDonations.reduce(
            (total, donation) => total + Number(donation.meta.amount ?? 0),
            0
        ),
        money_donations_count: moneyDonations.length,
        item_received_quantity: itemDonations.reduce(
            (total, donation) => total + Number(donation.meta.quantity ?? 0),
            0
        ),
        item_received_count: itemDonations.length,
        event_hours: completedEvents.reduce(
            (total, activity) => total + Number(activity.meta.hours ?? 0),
            0
        ),
        event_completed_count: completedEvents.length,
        certificates_count: certificatesCount,
        recent_activities: [...catalogStudentActivities]
            .sort(
                (left, right) =>
                    new Date(right.occurred_at).getTime() -
                    new Date(left.occurred_at).getTime()
            )
            .slice(0, 6)
            .map((item) => ({
                id: item.id,
                activity_type: item.activity_type,
                campaign_id: item.campaign_id,
                campaign_title: item.campaign_title,
                campaign_slug: item.campaign_slug,
                module_id: item.module_id,
                module_title: item.module_title,
                status: item.status,
                occurred_at: item.occurred_at,
                summary: `${item.campaign_title} - ${item.status}`,
            })),
    }
}
