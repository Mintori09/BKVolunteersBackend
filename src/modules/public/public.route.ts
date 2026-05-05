import { Router } from 'express'
import { prismaClient } from 'src/config'
import { ApiResponse } from 'src/utils/ApiResponse'
import { contractReady } from 'src/modules/_shared/contract-handlers'

const publicRouter = Router()

const PUBLIC_CAMPAIGN_STATUSES = ['PUBLISHED', 'ONGOING'] as const
const MODULE_TYPES = ['fundraising', 'item_donation', 'event'] as const

type PublicCampaignStatus = (typeof PUBLIC_CAMPAIGN_STATUSES)[number]
type ModuleType = (typeof MODULE_TYPES)[number]

type ModuleSettings = Record<string, unknown>

const toId = (id: bigint | number | string | null | undefined) =>
    id == null ? null : String(id)

const toNumber = (value: unknown) => {
    if (typeof value === 'number') return value
    if (typeof value === 'string') return Number(value) || 0
    if (value && typeof value === 'object' && 'toNumber' in value) {
        return (value as { toNumber: () => number }).toNumber()
    }
    return 0
}

const getPositiveIntQuery = (
    value: unknown,
    fallback: number,
    max?: number
) => {
    const parsed = Number(value ?? fallback)
    const normalized = Number.isFinite(parsed) ? Math.floor(parsed) : fallback
    const positive = Math.max(1, normalized)
    return max ? Math.min(max, positive) : positive
}

const parseOptionalBigIntQuery = (value: unknown) => {
    if (value == null || value === '') return undefined

    const raw = Array.isArray(value) ? value[0] : String(value)
    if (!/^\d+$/.test(raw)) return null

    return BigInt(raw)
}

const getSettingNumber = (
    settings: unknown,
    snakeKey: string,
    camelKey: string
) => {
    const data = settings && typeof settings === 'object'
        ? (settings as ModuleSettings)
        : {}
    return toNumber(data[snakeKey] ?? data[camelKey])
}

const calculateModuleProgress = async (module: {
    id: bigint
    type: ModuleType
    settingsJson: unknown
}) => {
    if (module.type === 'fundraising') {
        const target = getSettingNumber(
            module.settingsJson,
            'target_amount',
            'targetAmount'
        )
        const verified = await prismaClient.moneyDonation.aggregate({
            where: { moduleId: module.id, status: 'VERIFIED' },
            _sum: { amount: true },
        })
        const current = toNumber(verified._sum.amount)

        return {
            module_id: toId(module.id),
            type: module.type,
            current,
            target,
            percent: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
        }
    }

    if (module.type === 'item_donation') {
        const targets = await prismaClient.itemTarget.aggregate({
            where: { moduleId: module.id },
            _sum: { targetQuantity: true, receivedQuantity: true },
        })
        const target = toNumber(targets._sum.targetQuantity)
        const current = toNumber(targets._sum.receivedQuantity)

        return {
            module_id: toId(module.id),
            type: module.type,
            current,
            target,
            percent: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
        }
    }

    const quota = getSettingNumber(module.settingsJson, 'quota', 'quota')
    const completed = await prismaClient.eventRegistration.count({
        where: { moduleId: module.id, status: 'COMPLETED' },
    })

    return {
        module_id: toId(module.id),
        type: module.type,
        current: completed,
        target: quota,
        percent: quota > 0 ? Math.min(100, Math.round((completed / quota) * 100)) : 0,
    }
}

const calculateCampaignProgress = async (modules: Array<{
    id: bigint
    type: ModuleType
    settingsJson: unknown
}>) => {
    const moduleProgress = await Promise.all(modules.map(calculateModuleProgress))
    const percent =
        moduleProgress.length > 0
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

const getCta = (module: { type: ModuleType; status: string }) => {
    if (module.status !== 'OPEN') {
        return {
            enabled: false,
            label: 'Chưa mở đăng ký',
            action: null,
        }
    }

    if (module.type === 'fundraising') {
        return { enabled: true, label: 'Ủng hộ hiện kim', action: 'donate_money' }
    }
    if (module.type === 'item_donation') {
        return { enabled: true, label: 'Quyên góp hiện vật', action: 'pledge_item' }
    }
    return { enabled: true, label: 'Đăng ký tham gia', action: 'register_event' }
}

const mapCampaignCard = async (campaign: any) => {
    const modules = campaign.modules.filter((module: any) => !module.deletedAt)
    const progress = await calculateCampaignProgress(modules)

    return {
        id: toId(campaign.id),
        slug: campaign.slug,
        title: campaign.title,
        summary: campaign.summary,
        cover_image_url: campaign.coverImageUrl,
        organization: {
            id: toId(campaign.organization.id),
            code: campaign.organization.code,
            name: campaign.organization.name,
            type: campaign.organization.type,
            logo_url: campaign.organization.logoUrl,
        },
        module_types: [...new Set(modules.map((module: any) => module.type))],
        status: campaign.status,
        start_at: campaign.startAt,
        end_at: campaign.endAt,
        progress: {
            percent: progress.percent,
            modules: progress.modules,
        },
    }
}

publicRouter.get('/campaigns', async (req, res, next) => {
    try {
        const page = getPositiveIntQuery(req.query.page, 1)
        const limit = getPositiveIntQuery(req.query.limit, 9, 50)
        const status = String(req.query.status ?? '')
        const moduleType = String(req.query.module_type ?? '')
        const q = String(req.query.q ?? '').trim()
        const organizationId = parseOptionalBigIntQuery(req.query.organization_id)

        if (organizationId === null) {
            return ApiResponse.error(
                res,
                'organization_id must be a positive integer',
                400,
                { organization_id: req.query.organization_id },
                'PUBLIC_CAMPAIGN_INVALID_FILTER'
            )
        }

        const statuses: PublicCampaignStatus[] =
            PUBLIC_CAMPAIGN_STATUSES.includes(status as PublicCampaignStatus)
                ? [status as PublicCampaignStatus]
                : [...PUBLIC_CAMPAIGN_STATUSES]

        const where = {
            deletedAt: null,
            status: { in: statuses },
            ...(organizationId && { organizationId }),
            ...(MODULE_TYPES.includes(moduleType as ModuleType) && {
                modules: { some: { type: moduleType as ModuleType, deletedAt: null } },
            }),
            ...(q && {
                OR: [
                    { title: { contains: q } },
                    { summary: { contains: q } },
                    { organization: { name: { contains: q } } },
                ],
            }),
        }

        const [total, campaigns] = await Promise.all([
            prismaClient.campaign.count({ where }),
            prismaClient.campaign.findMany({
                where,
                include: {
                    organization: true,
                    modules: {
                        where: { deletedAt: null },
                        orderBy: { startAt: 'asc' },
                    },
                },
                orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
        ])

        const items = await Promise.all(campaigns.map(mapCampaignCard))

        return ApiResponse.success(
            res,
            items,
            'Public campaigns fetched successfully',
            200,
            {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            }
        )
    } catch (error) {
        next(error)
    }
})

publicRouter.get('/campaigns/:slug', async (req, res, next) => {
    try {
        const campaign = await prismaClient.campaign.findFirst({
            where: {
                slug: req.params.slug,
                deletedAt: null,
                status: { in: [...PUBLIC_CAMPAIGN_STATUSES] },
            },
            include: {
                organization: true,
                modules: {
                    where: { deletedAt: null },
                    orderBy: { startAt: 'asc' },
                },
            },
        })

        if (!campaign) {
            return ApiResponse.error(
                res,
                'Campaign not found',
                404,
                undefined,
                'PUBLIC_CAMPAIGN_NOT_FOUND'
            )
        }

        const card = await mapCampaignCard(campaign)
        const progress = await calculateCampaignProgress(campaign.modules as any)

        return ApiResponse.success(
            res,
            {
                ...card,
                description: campaign.description,
                beneficiary: campaign.beneficiary,
                scope_type: campaign.scopeType,
                published_at: campaign.publishedAt,
                modules: campaign.modules.map((module) => ({
                    id: toId(module.id),
                    type: module.type,
                    title: module.title,
                    description: module.description,
                    status: module.status,
                    start_at: module.startAt,
                    end_at: module.endAt,
                    settings: module.settingsJson,
                    progress: progress.modules.find(
                        (item) => item.module_id === toId(module.id)
                    ),
                    cta: getCta(module),
                })),
            },
            'Public campaign detail fetched successfully'
        )
    } catch (error) {
        next(error)
    }
})

publicRouter.get('/organizations/:code', (req, res) =>
    contractReady(res, {
        code: req.params.code,
        campaigns: [],
    }, 'Organization public profile contract is ready')
)
publicRouter.get('/certificates/verify/:certificateNo', (req, res) =>
    contractReady(res, {
        certificate_no: req.params.certificateNo,
        valid: false,
        status: 'NOT_FOUND',
    }, 'Certificate verify contract is ready')
)

export default publicRouter
