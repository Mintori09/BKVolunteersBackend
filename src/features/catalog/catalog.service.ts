import {
    CampaignModuleType,
    CampaignStatus,
    ClubStatus,
    Prisma,
    ReviewStatus,
} from '@prisma/client'
import { prismaClient } from 'src/config'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import {
    mapCampaignStatusToLegacy,
    mapContributionStatusToLegacy,
    mapItemContributionStatusToLegacy,
    mapLegacyScopeToDb,
    mapModuleStatusToLegacy,
    mapModuleTypeToLegacy,
    mapRegistrationStatusToLegacy,
    mapReviewStatusToLegacyCampaignStatus,
    mapScopeToLegacy,
    slugify,
} from './catalog.helpers'

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

const campaignDetailInclude = {
    faculty: true,
    club: true,
    coverFile: true,
    logoFile: true,
    tags: true,
    documents: {
        include: {
            file: true,
        },
    },
    media: {
        include: {
            file: true,
        },
        orderBy: {
            sortOrder: 'asc' as const,
        },
    },
    reviewRequests: {
        include: {
            comments: true,
        },
        orderBy: {
            submittedAt: 'desc' as const,
        },
    },
    modules: {
        include: {
            volunteerConfig: true,
            fundraisingConfig: {
                include: {
                    paymentAccount: true,
                    qrFile: true,
                },
            },
            itemDonationConfig: {
                include: {
                    targets: true,
                },
            },
            eventConfig: true,
            registrations: {
                include: {
                    checkins: true,
                },
            },
            moneyContributions: {
                include: {
                    providerTransactions: true,
                },
            },
            itemContributions: {
                include: {
                    lines: true,
                },
            },
            certificates: true,
        },
        orderBy: {
            displayOrder: 'asc' as const,
        },
    },
    certificates: true,
} satisfies Prisma.CampaignInclude

type CampaignDetailRecord = Prisma.CampaignGetPayload<{
    include: typeof campaignDetailInclude
}>

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

const toNumber = (value: Prisma.Decimal | number | null | undefined) =>
    value == null ? 0 : Number(value)

const isPublicCampaign = (campaign: CampaignDetailRecord) =>
    ['PUBLISHED', 'ONGOING', 'ENDED'].includes(campaign.status)

const getCurrentReviewStatus = (campaign: CampaignDetailRecord) =>
    campaign.reviewRequests[0]?.reviewStatus ?? null

const getCampaignLegacyStatus = (campaign: CampaignDetailRecord) =>
    mapCampaignStatusToLegacy(campaign.status, getCurrentReviewStatus(campaign))

const getCampaignOrganizationId = (
    campaign: Pick<CampaignDetailRecord, 'clubId' | 'facultyId'>
) =>
    campaign.clubId ??
    (campaign.facultyId ? `faculty-${campaign.facultyId}` : 'doan-truong')

const getCampaignOrganizationSummary = (
    campaign: Pick<
        CampaignDetailRecord,
        'club' | 'faculty' | 'clubId' | 'facultyId'
    >
) => {
    if (campaign.club) {
        return {
            id: campaign.club.id,
            code: `CLB-${campaign.club.id}`.toUpperCase(),
            name: campaign.club.name,
            type: 'CLUB',
            faculty_id: campaign.club.facultyId
                ? String(campaign.club.facultyId)
                : null,
            logo_url: null,
        }
    }

    if (campaign.faculty) {
        return {
            id: `faculty-${campaign.faculty.id}`,
            code: campaign.faculty.code,
            name: campaign.faculty.name,
            type: 'FACULTY',
            faculty_id: String(campaign.faculty.id),
            logo_url: null,
        }
    }

    return {
        id: 'doan-truong',
        code: 'DOANTRUONG',
        name: 'Đoàn trường',
        type: 'BOARD',
        faculty_id: null,
        logo_url: null,
    }
}

const getModuleProgress = (module: CampaignDetailRecord['modules'][number]) => {
    if (module.moduleType === 'FUNDRAISING_MONEY') {
        const target = toNumber(module.fundraisingConfig?.fundraisingGoalAmount)
        const current = module.moneyContributions
            .filter((item) => item.contributionStatus === 'VERIFIED')
            .reduce((total, item) => total + toNumber(item.amount), 0)

        return {
            current,
            target,
            percent:
                target > 0
                    ? Math.min(100, Math.round((current / target) * 100))
                    : 0,
        }
    }

    if (module.moduleType === 'ITEM_DONATION') {
        const target =
            module.itemDonationConfig?.targets.reduce(
                (total, item) => total + item.targetQuantity,
                0
            ) ?? 0
        const current = module.itemContributions
            .filter((item) => item.contributionStatus === 'RECEIVED')
            .reduce(
                (total, item) =>
                    total +
                    item.lines.reduce(
                        (lineTotal, line) => lineTotal + line.actualQuantity,
                        0
                    ),
                0
            )

        return {
            current,
            target,
            percent:
                target > 0
                    ? Math.min(100, Math.round((current / target) * 100))
                    : 0,
        }
    }

    if (module.moduleType === 'EVENT') {
        const target = module.eventConfig?.maxAttendees ?? 0
        const current = module.registrations.filter(
            (item) => item.status === 'COMPLETED'
        ).length

        return {
            current,
            target,
            percent:
                target > 0
                    ? Math.min(100, Math.round((current / target) * 100))
                    : 0,
        }
    }

    const target = module.volunteerConfig?.requiredQuantity ?? 0
    const current = module.registrations.filter((item) =>
        ['APPROVED', 'COMPLETED'].includes(item.status)
    ).length

    return {
        current,
        target,
        percent:
            target > 0
                ? Math.min(100, Math.round((current / target) * 100))
                : 0,
    }
}

const getModuleReport = (module: CampaignDetailRecord['modules'][number]) => {
    if (module.moduleType === 'FUNDRAISING_MONEY') {
        return {
            verified_money_amount: module.moneyContributions
                .filter((item) => item.contributionStatus === 'VERIFIED')
                .reduce((total, item) => total + toNumber(item.amount), 0),
            total_donations: module.moneyContributions.length,
            verified_donations: module.moneyContributions.filter(
                (item) => item.contributionStatus === 'VERIFIED'
            ).length,
        }
    }

    if (module.moduleType === 'ITEM_DONATION') {
        return {
            received_item_quantity: module.itemContributions
                .filter((item) => item.contributionStatus === 'RECEIVED')
                .reduce(
                    (total, item) =>
                        total +
                        item.lines.reduce(
                            (lineTotal, line) =>
                                lineTotal + line.actualQuantity,
                            0
                        ),
                    0
                ),
        }
    }

    const completedRegistrations = module.registrations.filter(
        (item) => item.status === 'COMPLETED'
    )

    const completedHours = completedRegistrations.reduce(
        (total, registration) => {
            const latestCheckin = registration.checkins
                .slice()
                .sort(
                    (left, right) =>
                        new Date(right.checkedInAt).getTime() -
                        new Date(left.checkedInAt).getTime()
                )[0]

            if (!latestCheckin?.checkedOutAt) {
                return total
            }

            const diffMs =
                new Date(latestCheckin.checkedOutAt).getTime() -
                new Date(latestCheckin.checkedInAt).getTime()

            return total + Math.max(0, diffMs / (1000 * 60 * 60))
        },
        0
    )

    return {
        registrations: module.registrations.length,
        completed_registrations: completedRegistrations.length,
        completed_hours: Number(completedHours.toFixed(1)),
    }
}

const getModuleSettings = (module: CampaignDetailRecord['modules'][number]) => {
    if (module.moduleType === 'EVENT') {
        return {
            location: module.eventConfig?.eventLocation ?? null,
            quota: module.eventConfig?.maxAttendees ?? null,
            registration_required: true,
            checkin_required: module.eventConfig?.checkinEnabled ?? false,
            format: module.eventConfig?.eventFormat ?? null,
            agenda: module.eventConfig?.eventAgenda ?? null,
        }
    }

    if (module.moduleType === 'FUNDRAISING_MONEY') {
        return {
            target_amount: toNumber(
                module.fundraisingConfig?.fundraisingGoalAmount
            ),
            minimum_amount: toNumber(
                module.fundraisingConfig?.minimumContributionAmount
            ),
            payment_method: module.fundraisingConfig?.paymentMethodType ?? null,
            receiver_name:
                module.fundraisingConfig?.paymentAccount.accountHolderName ??
                null,
            bank_name:
                module.fundraisingConfig?.paymentAccount.bankName ?? null,
            bank_account_no:
                module.fundraisingConfig?.paymentAccount.accountNumber ?? null,
            currency: 'VND',
            qr_file_url: module.fundraisingConfig?.qrFile?.publicUrl ?? null,
        }
    }

    if (module.moduleType === 'ITEM_DONATION') {
        return {
            receive_location:
                module.itemDonationConfig?.receiveLocation ?? null,
            receiver_name:
                module.itemDonationConfig?.receiverContactName ?? null,
            receiver_phone:
                module.itemDonationConfig?.receiverContactPhone ?? null,
            handover_method:
                module.itemDonationConfig?.handoverConfirmationMethod ?? null,
            allow_pre_registration:
                module.itemDonationConfig?.allowPreRegistration ?? false,
            targets:
                module.itemDonationConfig?.targets.map((item) => ({
                    id: item.id,
                    item_name: item.itemName,
                    unit_name: item.unitName,
                    target_quantity: item.targetQuantity,
                    quality_description: item.qualityDescription,
                    notes: item.notes,
                })) ?? [],
        }
    }

    return {
        required_quantity: module.volunteerConfig?.requiredQuantity ?? null,
        requirements: module.volunteerConfig?.requirementsText ?? null,
        location: module.volunteerConfig?.activityLocation ?? null,
        job_description: module.volunteerConfig?.jobDescription ?? null,
        auto_certificate_enabled:
            module.volunteerConfig?.autoCertificateEnabled ?? false,
        checkin_required: module.volunteerConfig?.checkinRequired ?? false,
    }
}

const mapCampaignReview = (campaign: CampaignDetailRecord) =>
    campaign.reviewRequests.flatMap((reviewRequest) =>
        reviewRequest.comments.map((comment) => ({
            id: comment.id,
            module_id: comment.moduleId ?? null,
            body: comment.commentText,
            visibility:
                comment.scopeType === 'CAMPAIGN' ? 'PUBLIC' : 'INTERNAL',
            attachment_url: null,
            created_at: comment.createdAt.toISOString(),
        }))
    )

const mapCampaignModule = (module: CampaignDetailRecord['modules'][number]) => {
    const progress = getModuleProgress(module)
    const type = mapModuleTypeToLegacy(module.moduleType)

    return {
        id: module.id,
        type,
        title: module.title,
        description: module.shortDescription ?? null,
        status: mapModuleStatusToLegacy(module.status),
        start_at: module.moduleStartAt.toISOString(),
        end_at: module.moduleEndAt.toISOString(),
        settings: getModuleSettings(module),
        progress,
        cta: {
            enabled: !['CANCELLED', 'CLOSED'].includes(
                mapModuleStatusToLegacy(module.status)
            ),
            label:
                type === 'event'
                    ? 'Đăng ký tham gia'
                    : type === 'fundraising'
                      ? 'Ủng hộ ngay'
                      : type === 'item_donation'
                        ? 'Đăng ký quyên góp'
                        : 'Đăng ký tình nguyện',
            action:
                type === 'event'
                    ? 'register'
                    : type === 'fundraising'
                      ? 'donate'
                      : type === 'item_donation'
                        ? 'pledge-item'
                        : 'volunteer-register',
        },
        report: getModuleReport(module),
    }
}

const mapCampaignDetail = (campaign: CampaignDetailRecord) => {
    const organization = getCampaignOrganizationSummary(campaign)
    const modules = campaign.modules.map(mapCampaignModule)

    return {
        id: campaign.id,
        organization_id: getCampaignOrganizationId(campaign),
        slug: slugify(campaign.title),
        title: campaign.title,
        summary: campaign.shortDescription ?? '',
        description: campaign.overallObjective ?? null,
        cover_image_url: campaign.coverFile?.publicUrl ?? null,
        beneficiary: campaign.beneficiaryDescription ?? null,
        scope_type: mapScopeToLegacy(campaign.participationScopeType),
        status: getCampaignLegacyStatus(campaign),
        start_at: campaign.campaignStartAt.toISOString(),
        end_at: campaign.campaignEndAt.toISOString(),
        published_at: campaign.publishedAt?.toISOString() ?? null,
        organization,
        module_types: modules.map((module) => module.type),
        modules,
        reviews: mapCampaignReview(campaign),
        issued_certificates: campaign.certificates.length,
        tags: campaign.tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            color: tag.color,
        })),
        media: campaign.media.map((item) => ({
            id: item.id,
            media_type: item.mediaType,
            caption: item.caption,
            is_public: item.isPublic,
            file_url: item.file.publicUrl,
        })),
        documents: campaign.documents.map((document) => ({
            id: document.id,
            type: document.documentType,
            is_public: document.isPublic,
            file_url: document.file.publicUrl,
            file_name: document.file.originalName,
        })),
    }
}

const queryCampaigns = async () =>
    prismaClient.campaign.findMany({
        where: {
            deletedAt: null,
        },
        include: campaignDetailInclude,
        orderBy: {
            campaignStartAt: 'desc',
        },
    })

const matchesQuery = (campaign: CampaignDetailRecord, q?: string) => {
    if (!q) {
        return true
    }

    const normalizedQuery = normalizeText(q)
    return [
        campaign.title,
        campaign.shortDescription ?? '',
        campaign.overallObjective ?? '',
        campaign.club?.name ?? '',
        campaign.faculty?.name ?? '',
        slugify(campaign.title),
    ]
        .map(normalizeText)
        .some((value) => value.includes(normalizedQuery))
}

const matchesModuleType = (
    campaign: CampaignDetailRecord,
    moduleType?: string
) => {
    if (!moduleType) {
        return true
    }

    return campaign.modules.some(
        (module) => mapModuleTypeToLegacy(module.moduleType) === moduleType
    )
}

const matchesStatus = (campaign: CampaignDetailRecord, status?: string) => {
    if (!status) {
        return true
    }

    return getCampaignLegacyStatus(campaign) === status
}

const matchesOrganization = (
    campaign: CampaignDetailRecord,
    organizationId?: string
) => {
    if (!organizationId) {
        return true
    }

    return getCampaignOrganizationId(campaign) === organizationId
}

const matchesDateWindow = (
    campaign: CampaignDetailRecord,
    from?: string,
    to?: string
) => {
    const startAt = new Date(campaign.campaignStartAt).getTime()
    const endAt = new Date(campaign.campaignEndAt).getTime()
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

export const listPublicCampaigns = async (filters: CampaignFilters) => {
    const campaigns = await queryCampaigns()

    const filtered = campaigns
        .filter(isPublicCampaign)
        .filter((campaign) => matchesQuery(campaign, filters.q))
        .filter((campaign) => matchesModuleType(campaign, filters.module_type))
        .filter((campaign) =>
            matchesOrganization(campaign, filters.organization_id)
        )
        .filter(
            (campaign) =>
                !filters.status ||
                getCampaignLegacyStatus(campaign) === filters.status
        )
        .map((campaign) => {
            const detail = mapCampaignDetail(campaign)
            const progressModules = detail.modules.map((module) => ({
                type: module.type,
                current: module.progress.current,
                target: module.progress.target,
                percent: module.progress.percent,
            }))
            const overallPercent =
                progressModules.length > 0
                    ? Math.round(
                          progressModules.reduce(
                              (total, item) => total + item.percent,
                              0
                          ) / progressModules.length
                      )
                    : 0

            return {
                id: detail.id,
                slug: detail.slug,
                title: detail.title,
                summary: detail.summary,
                cover_image_url: detail.cover_image_url,
                organization: {
                    id: detail.organization.id,
                    code: detail.organization.code,
                    name: detail.organization.name,
                    type: detail.organization.type,
                    logo_url: detail.organization.logo_url,
                },
                module_types: detail.module_types.filter(
                    (item) => item !== 'volunteer'
                ),
                status:
                    detail.status === 'ONGOING' || detail.status === 'ENDED'
                        ? detail.status
                        : 'PUBLISHED',
                start_at: detail.start_at,
                end_at: detail.end_at,
                progress: {
                    percent: overallPercent,
                    modules: progressModules,
                },
            }
        })

    return paginate(filtered, filters.page, filters.limit)
}

export const getPublicCampaignBySlug = async (slug: string) => {
    const campaigns = await queryCampaigns()
    const campaign = campaigns.find(
        (item) => slugify(item.title) === slug && isPublicCampaign(item)
    )

    if (!campaign) {
        return null
    }

    const detail = mapCampaignDetail(campaign)

    return {
        id: detail.id,
        slug: detail.slug,
        title: detail.title,
        summary: detail.summary,
        description: detail.description,
        cover_image_url: detail.cover_image_url,
        organization: {
            id: detail.organization.id,
            code: detail.organization.code,
            name: detail.organization.name,
            type: detail.organization.type,
            logo_url: detail.organization.logo_url,
        },
        module_types: detail.module_types.filter(
            (item) => item !== 'volunteer'
        ),
        status:
            detail.status === 'ONGOING' || detail.status === 'ENDED'
                ? detail.status
                : 'PUBLISHED',
        start_at: detail.start_at,
        end_at: detail.end_at,
        progress: {
            percent:
                detail.modules.length > 0
                    ? Math.round(
                          detail.modules.reduce(
                              (total, module) =>
                                  total + module.progress.percent,
                              0
                          ) / detail.modules.length
                      )
                    : 0,
            modules: detail.modules.map((module) => ({
                type: module.type,
                current: module.progress.current,
                target: module.progress.target,
                percent: module.progress.percent,
            })),
        },
        beneficiary: detail.beneficiary,
        scope_type: detail.scope_type,
        published_at: detail.published_at,
        modules: detail.modules.filter((module) => module.type !== 'volunteer'),
        tags: detail.tags,
        media: detail.media,
        documents: detail.documents.filter((document) => document.is_public),
    }
}

export const listManagedCampaigns = async (filters: CampaignFilters) => {
    const campaigns = await queryCampaigns()
    const filtered = campaigns
        .filter((campaign) => matchesQuery(campaign, filters.q))
        .filter((campaign) => matchesModuleType(campaign, filters.module_type))
        .filter((campaign) => matchesStatus(campaign, filters.status))
        .map((campaign) => {
            const detail = mapCampaignDetail(campaign)
            return {
                id: detail.id,
                slug: detail.slug,
                title: detail.title,
                summary: detail.summary,
                status: detail.status,
                organization_id: detail.organization_id,
                start_at: detail.start_at,
                end_at: detail.end_at,
                module_types: detail.module_types.filter(
                    (item) => item !== 'volunteer'
                ),
            }
        })

    return paginate(filtered, filters.page, filters.limit)
}

export const getManagedCampaignById = async (id: string) => {
    const campaign = await prismaClient.campaign.findFirst({
        where: {
            id,
            deletedAt: null,
        },
        include: campaignDetailInclude,
    })

    if (!campaign) {
        return null
    }

    return mapCampaignDetail(campaign)
}

export const listOrganizations = async () => {
    const [faculties, clubs] = await Promise.all([
        prismaClient.faculty.findMany({
            orderBy: {
                name: 'asc',
            },
        }),
        prismaClient.club.findMany({
            where: {
                deletedAt: null,
            },
            orderBy: {
                name: 'asc',
            },
        }),
    ])

    return [
        ...clubs.map((club) => ({
            id: club.id,
            code: `CLB-${club.id}`.toUpperCase(),
            name: club.name,
            type: 'CLUB',
            slug: slugify(club.name),
            logo_url: null,
            description: null,
            faculty: club.facultyId
                ? {
                      id: String(club.facultyId),
                      name: '',
                  }
                : null,
            status: club.status === ClubStatus.INACTIVE ? 'INACTIVE' : 'ACTIVE',
            created_at: club.createdAt.toISOString(),
        })),
        ...faculties.map((faculty) => ({
            id: `faculty-${faculty.id}`,
            code: faculty.code,
            name: faculty.name,
            type: 'FACULTY',
            slug: slugify(faculty.name),
            logo_url: null,
            description: null,
            faculty: {
                id: String(faculty.id),
                name: faculty.name,
            },
            status: 'ACTIVE',
            created_at: faculty.createdAt.toISOString(),
        })),
    ]
}

export const getOrganizationBySlug = async (slug: string) => {
    const organizations = await listOrganizations()
    const organization = organizations.find((item) => item.slug === slug)

    if (!organization) {
        return null
    }

    const campaigns = await queryCampaigns()
    const relatedCampaigns = campaigns
        .filter((campaign) => {
            if (organization.type === 'CLUB') {
                return (
                    campaign.clubId === organization.id &&
                    isPublicCampaign(campaign)
                )
            }

            if (organization.type === 'FACULTY') {
                return (
                    campaign.facultyId === Number(organization.faculty?.id) &&
                    isPublicCampaign(campaign)
                )
            }

            return false
        })
        .map((campaign) => ({
            id: campaign.id,
            slug: slugify(campaign.title),
            title: campaign.title,
            summary: campaign.shortDescription ?? '',
            status: getCampaignLegacyStatus(campaign),
            start_at: campaign.campaignStartAt.toISOString(),
            end_at: campaign.campaignEndAt.toISOString(),
            cover_image_url: campaign.coverFile?.publicUrl ?? null,
            module_types: campaign.modules
                .map((module) => mapModuleTypeToLegacy(module.moduleType))
                .filter((item) => item !== 'volunteer'),
        }))

    return {
        ...organization,
        campaigns: relatedCampaigns,
    }
}

const buildOrganizationBreakdown = (campaigns: CampaignDetailRecord[]) => {
    const organizationMap = new Map<
        string,
        {
            organization_id: number
            organization_name: string
            organization_code: string
            campaign_count: number
            verified_money_amount: number
            received_item_quantity: number
            completed_event_registrations: number
            completed_event_hours: number
            issued_certificates: number
        }
    >()

    campaigns.forEach((campaign) => {
        const summary = getCampaignOrganizationSummary(campaign)
        const key = summary.id
        const existing = organizationMap.get(key) ?? {
            organization_id: Number(key.replace(/\D+/g, '')) || 0,
            organization_name: summary.name,
            organization_code: summary.code,
            campaign_count: 0,
            verified_money_amount: 0,
            received_item_quantity: 0,
            completed_event_registrations: 0,
            completed_event_hours: 0,
            issued_certificates: 0,
        }

        existing.campaign_count += 1
        existing.issued_certificates += campaign.certificates.length

        campaign.modules.forEach((module) => {
            const report = getModuleReport(module)
            existing.verified_money_amount += report.verified_money_amount ?? 0
            existing.received_item_quantity +=
                report.received_item_quantity ?? 0
            existing.completed_event_registrations +=
                report.completed_registrations ?? 0
            existing.completed_event_hours += report.completed_hours ?? 0
        })

        organizationMap.set(key, existing)
    })

    return Array.from(organizationMap.values())
}

const buildModuleBreakdown = (campaigns: CampaignDetailRecord[]) => {
    const moduleTypeMap = new Map<string, number>()

    campaigns.forEach((campaign) => {
        campaign.modules.forEach((module) => {
            const key = mapModuleTypeToLegacy(module.moduleType)
            moduleTypeMap.set(key, (moduleTypeMap.get(key) ?? 0) + 1)
        })
    })

    return Array.from(moduleTypeMap.entries()).map(
        ([module_type, campaign_count]) => ({
            module_type,
            campaign_count,
        })
    )
}

const buildStatusBreakdown = (campaigns: CampaignDetailRecord[]) => {
    const statusMap = new Map<string, number>()

    campaigns.forEach((campaign) => {
        const key = String(getCampaignLegacyStatus(campaign))
        statusMap.set(key, (statusMap.get(key) ?? 0) + 1)
    })

    return Array.from(statusMap.entries()).map(([status, campaign_count]) => ({
        status,
        campaign_count,
    }))
}

export const getSchoolOverview = async (filters: OverviewFilters) => {
    const campaigns = await queryCampaigns()
    const filteredCampaigns = campaigns
        .filter((campaign) =>
            matchesOrganization(campaign, filters.organization_id)
        )
        .filter((campaign) => matchesModuleType(campaign, filters.module_type))
        .filter((campaign) => matchesStatus(campaign, filters.status))
        .filter((campaign) =>
            matchesDateWindow(campaign, filters.from, filters.to)
        )

    const totalMoney = filteredCampaigns.reduce(
        (total, campaign) =>
            total +
            campaign.modules.reduce(
                (moduleTotal, module) =>
                    moduleTotal +
                    (getModuleReport(module).verified_money_amount ?? 0),
                0
            ),
        0
    )

    const [studentsCount, unreadManager, unreadStudent, certificatesCount] =
        await Promise.all([
            prismaClient.student.count({
                where: {
                    deletedAt: null,
                },
            }),
            prismaClient.managerNotification.count({
                where: {
                    isRead: false,
                },
            }),
            prismaClient.studentNotification.count({
                where: {
                    isRead: false,
                },
            }),
            prismaClient.certificate.count(),
        ])

    return {
        total_campaigns: filteredCampaigns.length,
        total_students: studentsCount,
        total_organizations: (await listOrganizations()).length,
        total_money_donations: totalMoney,
        total_certificates: certificatesCount,
        total_unread_notifications: unreadManager + unreadStudent,
        organization_breakdown: buildOrganizationBreakdown(filteredCampaigns),
        module_breakdown: buildModuleBreakdown(filteredCampaigns),
        status_breakdown: buildStatusBreakdown(filteredCampaigns),
        filters_applied: {
            from: filters.from,
            to: filters.to,
            organization_id: filters.organization_id,
            module_type: filters.module_type,
            status: filters.status,
        },
    }
}

export const listAdminOrganizations = async (
    filters: AdminOrganizationFilters
) => {
    const organizations = await listOrganizations()
    const normalizedQuery = filters.q ? normalizeText(filters.q) : ''

    return organizations
        .filter((organization) => {
            if (!normalizedQuery) {
                return true
            }

            return [organization.name, organization.code, organization.slug]
                .map(normalizeText)
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
}

export const createAdminOrganization = async (
    input: AdminOrganizationInput
) => {
    if (!input.name?.trim() || !input.type?.trim()) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Code, name va type la bat buoc'
        )
    }

    if (input.type.trim() !== 'CLUB') {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'He thong hien chi ho tro tao don vi loai CLUB'
        )
    }

    const club = await prismaClient.club.create({
        data: {
            name: input.name.trim(),
            facultyId: input.faculty_id ? Number(input.faculty_id) : null,
            isSchoolLevel: !input.faculty_id,
            status: input.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
        },
    })

    return {
        id: club.id,
        code: input.code?.trim() || `CLB-${club.id}`.toUpperCase(),
        name: club.name,
        type: 'CLUB',
        slug: slugify(club.name),
        logo_url: null,
        description: input.description?.trim() || null,
        faculty: input.faculty_id
            ? {
                  id: input.faculty_id,
                  name: `Khoa ${input.faculty_id}`,
              }
            : null,
        status: club.status,
        created_at: club.createdAt.toISOString(),
    }
}

export const updateAdminOrganization = async (
    id: string,
    input: AdminOrganizationInput
) => {
    const club = await prismaClient.club.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    })

    if (!club) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay don vi')
    }

    const updated = await prismaClient.club.update({
        where: {
            id,
        },
        data: {
            ...(input.name?.trim() ? { name: input.name.trim() } : {}),
            ...(input.faculty_id !== undefined
                ? {
                      facultyId: input.faculty_id
                          ? Number(input.faculty_id)
                          : null,
                      isSchoolLevel: !input.faculty_id,
                  }
                : {}),
            ...(input.status
                ? {
                      status:
                          input.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
                  }
                : {}),
        },
    })

    return {
        id: updated.id,
        code: input.code?.trim() || `CLB-${updated.id}`.toUpperCase(),
        name: updated.name,
        type: 'CLUB',
        slug: slugify(updated.name),
        logo_url: null,
        description: input.description?.trim() || null,
        faculty: updated.facultyId
            ? {
                  id: String(updated.facultyId),
                  name: `Khoa ${updated.facultyId}`,
              }
            : null,
        status: updated.status,
        created_at: updated.createdAt.toISOString(),
    }
}

export const deleteAdminOrganization = async (id: string) => {
    const club = await prismaClient.club.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    })

    if (!club) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Khong tim thay don vi')
    }

    const isReferencedByCampaign = await prismaClient.campaign.count({
        where: {
            clubId: id,
            deletedAt: null,
        },
    })

    if (isReferencedByCampaign > 0) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Don vi dang duoc su dung trong cac chien dich'
        )
    }

    await prismaClient.club.update({
        where: {
            id,
        },
        data: {
            deletedAt: new Date(),
        },
    })
}

export const getCampaignReport = async (id: string) => {
    const campaign = await prismaClient.campaign.findFirst({
        where: {
            id,
            deletedAt: null,
        },
        include: campaignDetailInclude,
    })

    if (!campaign) {
        return null
    }

    return {
        campaign: {
            id: Number(campaign.id.replace(/\D+/g, '')) || 0,
            title: campaign.title,
            slug: slugify(campaign.title),
            status: getCampaignLegacyStatus(campaign),
        },
        modules: campaign.modules.map((module) => ({
            id: Number(module.id.replace(/\D+/g, '')) || 0,
            type: mapModuleTypeToLegacy(module.moduleType),
            status: mapModuleStatusToLegacy(module.status),
        })),
        fundraising: {
            total_verified_amount: campaign.modules.reduce(
                (total, module) =>
                    total +
                    (getModuleReport(module).verified_money_amount ?? 0),
                0
            ),
            total_donations: campaign.modules.reduce(
                (total, module) =>
                    total + (getModuleReport(module).total_donations ?? 0),
                0
            ),
            verified_donations: campaign.modules.reduce(
                (total, module) =>
                    total + (getModuleReport(module).verified_donations ?? 0),
                0
            ),
        },
        item_donations: {
            received_quantity: campaign.modules.reduce(
                (total, module) =>
                    total +
                    (getModuleReport(module).received_item_quantity ?? 0),
                0
            ),
        },
        events: {
            registrations: campaign.modules.reduce(
                (total, module) =>
                    total + (getModuleReport(module).registrations ?? 0),
                0
            ),
            completed_registrations: campaign.modules.reduce(
                (total, module) =>
                    total +
                    (getModuleReport(module).completed_registrations ?? 0),
                0
            ),
            completed_hours: Number(
                campaign.modules
                    .reduce(
                        (total, module) =>
                            total +
                            (getModuleReport(module).completed_hours ?? 0),
                        0
                    )
                    .toFixed(1)
            ),
        },
        certificates: {
            issued_total: campaign.certificates.length,
        },
    }
}

export const getCampaignReconciliation = async (id: string) => {
    const campaign = await prismaClient.campaign.findFirst({
        where: {
            id,
            deletedAt: null,
        },
        include: campaignDetailInclude,
    })

    if (!campaign) {
        return null
    }

    const allContributions = campaign.modules.flatMap(
        (module) => module.moneyContributions
    )
    const totalTransactions = allContributions.reduce(
        (total, contribution) =>
            total + contribution.providerTransactions.length,
        0
    )
    const matchedTransactions = allContributions.reduce(
        (total, contribution) =>
            total +
            contribution.providerTransactions.filter(
                (item) => item.realtimeStatementMatched
            ).length,
        0
    )
    const totalTransactionAmount = allContributions.reduce(
        (total, contribution) =>
            total +
            contribution.providerTransactions.reduce(
                (transactionTotal) =>
                    transactionTotal + toNumber(contribution.amount),
                0
            ),
        0
    )
    const verifiedAmount = allContributions
        .filter((item) => item.contributionStatus === 'VERIFIED')
        .reduce((total, item) => total + toNumber(item.amount), 0)

    return {
        campaign: {
            id: Number(campaign.id.replace(/\D+/g, '')) || 0,
            title: campaign.title,
            slug: slugify(campaign.title),
            status: getCampaignLegacyStatus(campaign),
            organization_id:
                Number(
                    getCampaignOrganizationId(campaign).replace(/\D+/g, '')
                ) || 0,
        },
        reconciliation: {
            matched_transactions: matchedTransactions,
            unmatched_transactions: Math.max(
                0,
                totalTransactions - matchedTransactions
            ),
            total_transaction_amount: totalTransactionAmount,
            matched_transaction_amount: verifiedAmount,
            unmatched_transaction_amount: Math.max(
                0,
                totalTransactionAmount - verifiedAmount
            ),
            pending_donations: allContributions.filter(
                (item) => item.contributionStatus === 'PENDING'
            ).length,
            matched_donations: allContributions.filter((item) =>
                item.providerTransactions.some(
                    (transaction) => transaction.realtimeStatementMatched
                )
            ).length,
            verified_donations: allContributions.filter(
                (item) => item.contributionStatus === 'VERIFIED'
            ).length,
            rejected_donations: allContributions.filter(
                (item) => item.contributionStatus === 'REJECTED'
            ).length,
            verified_amount: verifiedAmount,
            amount_gap_vs_verified: Math.max(
                0,
                totalTransactionAmount - verifiedAmount
            ),
        },
    }
}

export const getApprovalQueue = async (filters: CampaignFilters) => {
    const campaigns = await queryCampaigns()
    return campaigns
        .filter((campaign) =>
            ['SUBMITTED', 'PRE_APPROVED'].includes(
                String(getCampaignLegacyStatus(campaign))
            )
        )
        .filter((campaign) => matchesQuery(campaign, filters.q))
        .filter((campaign) => matchesModuleType(campaign, filters.module_type))
        .filter(
            (campaign) =>
                !filters.status ||
                getCampaignLegacyStatus(campaign) === filters.status
        )
        .map((campaign) => {
            const organization = getCampaignOrganizationSummary(campaign)
            return {
                id: campaign.id,
                slug: slugify(campaign.title),
                title: campaign.title,
                summary: campaign.shortDescription ?? '',
                status: getCampaignLegacyStatus(campaign),
                organization: {
                    id: organization.id,
                    code: organization.code,
                    name: organization.name,
                    type: organization.type,
                },
                module_types: campaign.modules
                    .map((module) => mapModuleTypeToLegacy(module.moduleType))
                    .filter((item) => item !== 'volunteer'),
                submitted_at:
                    campaign.reviewRequests[0]?.submittedAt.toISOString() ??
                    campaign.createdAt.toISOString(),
            }
        })
}

export const getApprovalCampaignDetail = async (campaignId: string) => {
    const campaign = await prismaClient.campaign.findFirst({
        where: {
            id: campaignId,
            deletedAt: null,
        },
        include: campaignDetailInclude,
    })

    if (!campaign) {
        return null
    }

    return mapCampaignDetail(campaign)
}

export const getStudentActivities = async (
    userId: string,
    filters: {
        type?: string
        status?: string
    }
) => {
    const student = await prismaClient.student.findUnique({
        where: {
            userId,
        },
        include: {
            moduleRegistrations: {
                include: {
                    module: {
                        include: {
                            campaign: true,
                        },
                    },
                    checkins: true,
                },
            },
            moneyContributions: {
                include: {
                    module: {
                        include: {
                            campaign: true,
                        },
                    },
                },
            },
            itemContributions: {
                include: {
                    module: {
                        include: {
                            campaign: true,
                        },
                    },
                    lines: true,
                },
            },
            certificates: {
                include: {
                    campaign: true,
                    module: true,
                },
            },
        },
    })

    if (!student) {
        return []
    }

    const registrations = student.moduleRegistrations.map((item) => {
        const latestCheckin = item.checkins
            .slice()
            .sort(
                (left, right) =>
                    new Date(right.checkedInAt).getTime() -
                    new Date(left.checkedInAt).getTime()
            )[0]
        const checkinState =
            item.status === 'COMPLETED'
                ? 'COMPLETED'
                : latestCheckin && !latestCheckin.checkedOutAt
                  ? 'CHECKED_IN'
                  : null

        return {
            id: item.id,
            activity_type: 'event_registration',
            reference_id: item.id,
            campaign_id: item.module.campaignId,
            campaign_title: item.module.campaign.title,
            campaign_slug: slugify(item.module.campaign.title),
            module_id: item.moduleId,
            module_title: item.module.title,
            module_type: mapModuleTypeToLegacy(item.module.moduleType),
            status: mapRegistrationStatusToLegacy(item.status, checkinState),
            occurred_at: item.updatedAt.toISOString(),
            meta: {
                registration_type: item.registrationType,
                checked_in_at:
                    latestCheckin?.checkedInAt?.toISOString() ?? null,
                checked_out_at:
                    latestCheckin?.checkedOutAt?.toISOString() ?? null,
            },
        }
    })

    const moneyDonations = student.moneyContributions.map((item) => ({
        id: item.id,
        activity_type: 'money_donation',
        reference_id: item.id,
        campaign_id: item.module.campaignId,
        campaign_title: item.module.campaign.title,
        campaign_slug: slugify(item.module.campaign.title),
        module_id: item.moduleId,
        module_title: item.module.title,
        module_type: mapModuleTypeToLegacy(item.module.moduleType),
        status: mapContributionStatusToLegacy(
            item.contributionStatus,
            Boolean(item.paymentProviderTransactionId)
        ),
        occurred_at: item.updatedAt.toISOString(),
        meta: {
            amount: toNumber(item.amount),
        },
    }))

    const itemDonations = student.itemContributions.map((item) => ({
        id: item.id,
        activity_type: 'item_pledge',
        reference_id: item.id,
        campaign_id: item.module.campaignId,
        campaign_title: item.module.campaign.title,
        campaign_slug: slugify(item.module.campaign.title),
        module_id: item.moduleId,
        module_title: item.module.title,
        module_type: mapModuleTypeToLegacy(item.module.moduleType),
        status: mapItemContributionStatusToLegacy(item.contributionStatus),
        occurred_at: item.updatedAt.toISOString(),
        meta: {
            quantity: item.lines.reduce(
                (total, line) => total + Number(line.actualQuantity),
                0
            ),
        },
    }))

    const certificates = student.certificates.map((item) => ({
        id: item.id,
        activity_type: 'certificate',
        reference_id: item.serialNumber,
        campaign_id: item.campaignId,
        campaign_title: item.campaign?.title ?? 'Chứng nhận hệ thống',
        campaign_slug: item.campaign ? slugify(item.campaign.title) : '',
        module_id: item.moduleId,
        module_title: item.module?.title ?? '',
        module_type: item.module
            ? mapModuleTypeToLegacy(item.module.moduleType)
            : null,
        status: item.status,
        occurred_at: item.updatedAt.toISOString(),
        meta: {
            certificate_type: item.certificateType,
        },
    }))

    return [
        ...registrations,
        ...moneyDonations,
        ...itemDonations,
        ...certificates,
    ]
        .filter((item) => !filters.type || item.activity_type === filters.type)
        .filter((item) => !filters.status || item.status === filters.status)
        .sort(
            (left, right) =>
                new Date(right.occurred_at).getTime() -
                new Date(left.occurred_at).getTime()
        )
}

export const getStudentDonations = async (
    userId: string,
    filters: {
        type?: string
        status?: string
    }
) => {
    const activities = await getStudentActivities(userId, {})

    return activities
        .filter(
            (item) =>
                item.activity_type === 'money_donation' ||
                item.activity_type === 'item_pledge'
        )
        .map((item) => ({
            id: item.id,
            donation_type:
                item.activity_type === 'money_donation' ? 'money' : 'item',
            reference_id: item.reference_id,
            campaign_id: item.campaign_id,
            campaign_title: item.campaign_title,
            campaign_slug: item.campaign_slug,
            module_id: item.module_id,
            module_title: item.module_title,
            status: item.status,
            occurred_at: item.occurred_at,
            meta: item.meta,
        }))
        .filter((item) => !filters.type || item.donation_type === filters.type)
        .filter((item) => !filters.status || item.status === filters.status)
}

export const getStudentDashboard = async (userId: string) => {
    const [activities, donations] = await Promise.all([
        getStudentActivities(userId, {}),
        getStudentDonations(userId, {}),
    ])

    const distinctCampaignIds = new Set(
        activities.map((item) => item.campaign_id).filter(Boolean) as string[]
    )
    const moneyDonations = donations.filter(
        (item) => item.donation_type === 'money' && item.status === 'VERIFIED'
    )
    const itemDonations = donations.filter(
        (item) => item.donation_type === 'item' && item.status === 'RECEIVED'
    )
    const completedEvents = activities.filter(
        (item) =>
            item.activity_type === 'event_registration' &&
            item.status === 'COMPLETED'
    )
    const certificatesCount = activities.filter(
        (item) => item.activity_type === 'certificate'
    ).length
    const getNumericMeta = (meta: unknown, key: 'amount' | 'quantity') => {
        const record =
            meta && typeof meta === 'object'
                ? (meta as Record<string, unknown>)
                : {}
        return Number(record[key] ?? 0)
    }
    const getStringMeta = (
        meta: unknown,
        key: 'checked_in_at' | 'checked_out_at'
    ) => {
        const record =
            meta && typeof meta === 'object'
                ? (meta as Record<string, unknown>)
                : {}
        return String(record[key] ?? '')
    }

    return {
        campaigns_count: distinctCampaignIds.size,
        money_amount: moneyDonations.reduce(
            (total, donation) =>
                total + getNumericMeta(donation.meta, 'amount'),
            0
        ),
        money_donations_count: moneyDonations.length,
        item_received_quantity: itemDonations.reduce(
            (total, donation) =>
                total + getNumericMeta(donation.meta, 'quantity'),
            0
        ),
        item_received_count: itemDonations.length,
        event_hours: Number(
            completedEvents
                .reduce((total, activity) => {
                    const checkedInAt = getStringMeta(
                        activity.meta,
                        'checked_in_at'
                    )
                    const checkedOutAt = getStringMeta(
                        activity.meta,
                        'checked_out_at'
                    )

                    if (!checkedInAt || !checkedOutAt) {
                        return total
                    }

                    const diffMs =
                        new Date(checkedOutAt).getTime() -
                        new Date(checkedInAt).getTime()

                    return total + Math.max(0, diffMs / (1000 * 60 * 60))
                }, 0)
                .toFixed(1)
        ),
        event_completed_count: completedEvents.length,
        certificates_count: certificatesCount,
        recent_activities: activities.slice(0, 6).map((item) => ({
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
