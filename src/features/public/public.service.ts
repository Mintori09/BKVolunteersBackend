import { HttpStatus } from 'src/common/constants'
import { serializeId, serializePagination } from 'src/common/serializers'
import { ApiError } from 'src/utils/ApiError'
import * as publicRepository from './public.repository'
import {
    PublicCampaignDetailOutput,
    PublicCampaignListItemOutput,
    PublicCampaignListOutput,
    PublicCampaignListQuery,
    PublicCertificateVerifyOutput,
} from './types'

const moduleTypeToApi = (value: string) => {
    switch (value) {
        case 'FUNDRAISING':
            return 'fundraising'
        case 'ITEM_DONATION':
            return 'item_donation'
        case 'EVENT':
            return 'event'
        default:
            return value.toLowerCase()
    }
}

const toSettings = (settingsJson: unknown) =>
    settingsJson && typeof settingsJson === 'object'
        ? (settingsJson as Record<string, unknown>)
        : {}

const buildModuleProgress = (module: {
    type: string
    settingsJson: unknown
    moneyDonations: Array<{ amount: unknown }>
    itemTargets: Array<{ targetQuantity: number; receivedQuantity: number }>
    eventRegistrations: Array<{ id: bigint }>
}) => {
    const type = moduleTypeToApi(module.type)

    if (type === 'fundraising') {
        const current = module.moneyDonations.reduce(
            (sum, item) => sum + Number(item.amount),
            0
        )
        const target = Number(toSettings(module.settingsJson).target_amount ?? 0)
        return {
            type,
            current,
            target,
            percent: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
        }
    }

    if (type === 'item_donation') {
        const current = module.itemTargets.reduce(
            (sum, item) => sum + item.receivedQuantity,
            0
        )
        const target = module.itemTargets.reduce(
            (sum, item) => sum + item.targetQuantity,
            0
        )
        return {
            type,
            current,
            target,
            percent: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
        }
    }

    const current = module.eventRegistrations.length
    const target = Number(toSettings(module.settingsJson).quota ?? 0)
    return {
        type,
        current,
        target,
        percent: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
    }
}

const buildCampaignProgress = (modules: Array<{
    type: string
    settingsJson: unknown
    moneyDonations: Array<{ amount: unknown }>
    itemTargets: Array<{ targetQuantity: number; receivedQuantity: number }>
    eventRegistrations: Array<{ id: bigint }>
}>) => {
    const moduleProgress = modules.map(buildModuleProgress)
    const percent = moduleProgress.length
        ? Math.round(
              moduleProgress.reduce((sum, item) => sum + item.percent, 0) /
                  moduleProgress.length
          )
        : 0

    return {
        percent,
        modules: moduleProgress,
    }
}

const buildModuleCta = (
    module: {
        type: string
        status: string
        startAt: Date
        endAt: Date
    },
    campaignStatus: string
) => {
    const type = moduleTypeToApi(module.type)
    const isOpen =
        ['PUBLISHED', 'ONGOING'].includes(campaignStatus) &&
        !['CLOSED', 'CANCELLED'].includes(module.status) &&
        Date.now() >= module.startAt.getTime() &&
        Date.now() <= module.endAt.getTime()

    if (type === 'item_donation') {
        return {
            enabled: isOpen,
            label: isOpen ? 'Đăng ký hiện vật' : 'Đã đóng tiếp nhận',
            action: isOpen ? 'item_pledge' : null,
        }
    }

    if (type === 'event') {
        return {
            enabled: isOpen,
            label: isOpen ? 'Đăng ký sự kiện' : 'Đã đóng đăng ký',
            action: isOpen ? 'event_register' : null,
        }
    }

    return {
        enabled: false,
        label: 'Theo dõi gây quỹ',
        action: null,
    }
}

const serializeCampaign = (item: Awaited<
    ReturnType<typeof publicRepository.findPublicCampaignBySlug>
> extends infer T
    ? Exclude<T, null>
    : never): PublicCampaignListItemOutput => ({
    id: serializeId(item.id)!,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    cover_image_url: item.coverImageUrl,
    organization: {
        id: serializeId(item.organization.id)!,
        code: item.organization.code,
        name: item.organization.name,
        type: item.organization.type,
        logo_url: item.organization.logoUrl,
    },
    module_types: Array.from(
        new Set(item.modules.map((module) => moduleTypeToApi(module.type)))
    ),
    progress: buildCampaignProgress(item.modules),
    beneficiary: item.beneficiary,
    scope_type: item.scopeType,
    start_at: item.startAt,
    end_at: item.endAt,
    status: item.status,
})

export const listCampaigns = async (
    query: PublicCampaignListQuery
): Promise<PublicCampaignListOutput> => {
    const page = query.page ?? 1
    const limit = query.limit ?? 10
    const [items, total] = await publicRepository.findPublicCampaigns(query)

    return serializePagination(
        items.map((item) => serializeCampaign(item)),
        {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        }
    )
}

export const getCampaignBySlug = async (
    slug: string
): Promise<PublicCampaignDetailOutput> => {
    const item = await publicRepository.findPublicCampaignBySlug(slug)

    if (!item || !['PUBLISHED', 'ONGOING'].includes(item.status)) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Campaign not found')
    }

    const progress = buildCampaignProgress(item.modules)

    return {
        ...serializeCampaign(item),
        description: item.description,
        published_at: item.publishedAt,
        modules: item.modules.map((module) => ({
            id: serializeId(module.id)!,
            type: moduleTypeToApi(module.type),
            title: module.title,
            description: module.description,
            status: module.status,
            start_at: module.startAt,
            end_at: module.endAt,
            settings: toSettings(module.settingsJson),
            progress: progress.modules.find(
                (entry) => entry.type === moduleTypeToApi(module.type)
            ),
            cta: buildModuleCta(module, item.status),
        })),
    }
}

export const verifyCertificate = async (
    certificateNo: string
): Promise<PublicCertificateVerifyOutput> => {
    const certificate = await publicRepository.findCertificateByNumber(
        certificateNo
    )

    if (!certificate) {
        return { valid: false, certificate: null }
    }

    const anyCert = certificate as any
    const isIssued =
        ['READY', 'SIGNED'].includes(certificate.status) &&
        certificate.issuedAt !== null &&
        certificate.revokedAt === null

    return {
        valid: isIssued,
        certificate: {
            id: serializeId(certificate.id)!,
            certificate_no: certificate.certificateNo,
            status: certificate.status,
            issued_at: certificate.issuedAt,
            revoked_at: certificate.revokedAt,
            student_id: serializeId(certificate.studentId)!,
            campaign_id: serializeId(certificate.campaignId)!,
            student_name: anyCert.student?.fullName ?? null,
            campaign_title: anyCert.campaign?.title ?? null,
            organization: anyCert.campaign?.organization?.name ?? null,
        },
    }
}
