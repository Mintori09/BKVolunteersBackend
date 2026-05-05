import { Router } from 'express'
import { prismaClient } from 'src/config'
import {
    requireAccountType,
    requireAuth,
} from 'src/common/middleware'
import { ApiResponse } from 'src/utils/ApiResponse'

const studentsRouter = Router()
const ACTIVITY_TYPES = ['money_donation', 'item_pledge', 'event_registration', 'certificate'] as const

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

const getPositiveIntQuery = (value: unknown, fallback: number, max?: number) => {
    const parsed = Number(value ?? fallback)
    const normalized = Number.isFinite(parsed) ? Math.floor(parsed) : fallback
    const positive = Math.max(1, normalized)
    return max ? Math.min(max, positive) : positive
}

studentsRouter.use(requireAuth, requireAccountType('STUDENT'))

studentsRouter.get('/me/dashboard', async (req, res, next) => {
    try {
        const studentId = BigInt(req.payload!.userId)

        const [
            moneyAggregate,
            itemAggregate,
            eventAggregate,
            certificatesCount,
            campaignRefs,
            recentMoney,
            recentItem,
            recentEvent,
            recentCertificate,
        ] = await Promise.all([
            prismaClient.moneyDonation.aggregate({
                where: {
                    studentId,
                    status: 'VERIFIED',
                },
                _sum: { amount: true },
                _count: { _all: true },
            }),
            prismaClient.itemPledge.aggregate({
                where: {
                    studentId,
                    status: 'RECEIVED',
                },
                _sum: { receivedQuantity: true },
                _count: { _all: true },
            }),
            prismaClient.eventRegistration.aggregate({
                where: {
                    studentId,
                    status: 'COMPLETED',
                },
                _sum: { hours: true },
                _count: { _all: true },
            }),
            prismaClient.certificate.count({
                where: {
                    studentId,
                    status: { in: ['READY', 'SIGNED'] },
                },
            }),
            prismaClient.campaign.findMany({
                where: {
                    OR: [
                        { moneyDonations: { some: { studentId } } },
                        { itemPledges: { some: { studentId } } },
                        { eventRegistrations: { some: { studentId } } },
                    ],
                },
                select: { id: true },
            }),
            prismaClient.moneyDonation.findMany({
                where: { studentId },
                include: {
                    campaign: {
                        select: { title: true, slug: true },
                    },
                    module: {
                        select: { title: true, type: true },
                    },
                },
                orderBy: { updatedAt: 'desc' },
                take: 5,
            }),
            prismaClient.itemPledge.findMany({
                where: { studentId },
                include: {
                    campaign: {
                        select: { title: true, slug: true },
                    },
                    module: {
                        select: { title: true, type: true },
                    },
                    itemTarget: {
                        select: { name: true, unit: true },
                    },
                },
                orderBy: { updatedAt: 'desc' },
                take: 5,
            }),
            prismaClient.eventRegistration.findMany({
                where: { studentId },
                include: {
                    campaign: {
                        select: { title: true, slug: true },
                    },
                    module: {
                        select: { title: true, type: true },
                    },
                },
                orderBy: { updatedAt: 'desc' },
                take: 5,
            }),
            prismaClient.certificate.findMany({
                where: { studentId },
                include: {
                    campaign: {
                        select: { title: true, slug: true },
                    },
                },
                orderBy: { updatedAt: 'desc' },
                take: 5,
            }),
        ])

        const recentActivities = [
            ...recentMoney.map((row) => ({
                id: `money-${toId(row.id)}`,
                activity_type: 'money_donation' as const,
                campaign_id: toId(row.campaignId),
                campaign_title: row.campaign.title,
                campaign_slug: row.campaign.slug,
                module_id: toId(row.moduleId),
                module_title: row.module.title,
                status: row.status,
                occurred_at: row.updatedAt,
                summary: `Ủng hộ ${toNumber(row.amount)} VND`,
            })),
            ...recentItem.map((row) => ({
                id: `item-${toId(row.id)}`,
                activity_type: 'item_pledge' as const,
                campaign_id: toId(row.campaignId),
                campaign_title: row.campaign.title,
                campaign_slug: row.campaign.slug,
                module_id: toId(row.moduleId),
                module_title: row.module.title,
                status: row.status,
                occurred_at: row.updatedAt,
                summary: `Quyên góp ${row.quantity} ${row.itemTarget.unit} ${row.itemTarget.name}`,
            })),
            ...recentEvent.map((row) => ({
                id: `event-${toId(row.id)}`,
                activity_type: 'event_registration' as const,
                campaign_id: toId(row.campaignId),
                campaign_title: row.campaign.title,
                campaign_slug: row.campaign.slug,
                module_id: toId(row.moduleId),
                module_title: row.module.title,
                status: row.status,
                occurred_at: row.updatedAt,
                summary: `Tham gia sự kiện (${row.status})`,
            })),
            ...recentCertificate.map((row) => ({
                id: `certificate-${toId(row.id)}`,
                activity_type: 'certificate' as const,
                campaign_id: toId(row.campaignId),
                campaign_title: row.campaign.title,
                campaign_slug: row.campaign.slug,
                module_id: toId(row.moduleId),
                module_title: 'Chứng nhận',
                status: row.status,
                occurred_at: row.updatedAt,
                summary: `Chứng nhận ${row.certificateNo}`,
            })),
        ]
            .sort(
                (left, right) =>
                    new Date(right.occurred_at).getTime() -
                    new Date(left.occurred_at).getTime()
            )
            .slice(0, 10)

        return ApiResponse.success(
            res,
            {
                campaigns_count: campaignRefs.length,
                money_amount: toNumber(moneyAggregate._sum.amount),
                money_donations_count: moneyAggregate._count._all,
                item_received_quantity: toNumber(itemAggregate._sum.receivedQuantity),
                item_received_count: itemAggregate._count._all,
                event_hours: toNumber(eventAggregate._sum.hours),
                event_completed_count: eventAggregate._count._all,
                certificates_count: certificatesCount,
                recent_activities: recentActivities,
            },
            'Student dashboard fetched successfully'
        )
    } catch (error) {
        next(error)
    }
})

studentsRouter.get('/me/activities', async (req, res, next) => {
    try {
        const studentId = BigInt(req.payload!.userId)
        const type = String(req.query.type ?? '').trim().toLowerCase()
        const status = String(req.query.status ?? '').trim().toUpperCase()
        const page = getPositiveIntQuery(req.query.page, 1)
        const limit = getPositiveIntQuery(req.query.limit, 10, 100)

        if (type && !ACTIVITY_TYPES.includes(type as (typeof ACTIVITY_TYPES)[number])) {
            return ApiResponse.error(
                res,
                'type must be one of money_donation, item_pledge, event_registration or certificate',
                400,
                { type },
                'STUDENT_ACTIVITY_INVALID_FILTER'
            )
        }

        const [moneyRows, itemRows, eventRows, certificateRows] = await Promise.all([
            type && type !== 'money_donation'
                ? Promise.resolve([])
                : prismaClient.moneyDonation.findMany({
                      where: {
                          studentId,
                          ...(status && { status: status as any }),
                      },
                      include: {
                          campaign: { select: { title: true, slug: true } },
                          module: { select: { title: true, type: true } },
                      },
                  }),
            type && type !== 'item_pledge'
                ? Promise.resolve([])
                : prismaClient.itemPledge.findMany({
                      where: {
                          studentId,
                          ...(status && { status: status as any }),
                      },
                      include: {
                          campaign: { select: { title: true, slug: true } },
                          module: { select: { title: true, type: true } },
                          itemTarget: { select: { name: true, unit: true } },
                      },
                  }),
            type && type !== 'event_registration'
                ? Promise.resolve([])
                : prismaClient.eventRegistration.findMany({
                      where: {
                          studentId,
                          ...(status && { status: status as any }),
                      },
                      include: {
                          campaign: { select: { title: true, slug: true } },
                          module: { select: { title: true, type: true } },
                      },
                  }),
            type && type !== 'certificate'
                ? Promise.resolve([])
                : prismaClient.certificate.findMany({
                      where: {
                          studentId,
                          ...(status && { status: status as any }),
                      },
                      include: {
                          campaign: { select: { title: true, slug: true } },
                          module: { select: { title: true, type: true } },
                      },
                  }),
        ])

        const allItems = [
            ...moneyRows.map((row) => ({
                id: `money-${toId(row.id)}`,
                activity_type: 'money_donation' as const,
                reference_id: toId(row.id),
                campaign_id: toId(row.campaignId),
                campaign_title: row.campaign.title,
                campaign_slug: row.campaign.slug,
                module_id: toId(row.moduleId),
                module_title: row.module.title,
                module_type: row.module.type,
                status: row.status,
                occurred_at: row.updatedAt,
                meta: {
                    amount: toNumber(row.amount),
                    donor_name: row.donorName,
                },
            })),
            ...itemRows.map((row) => ({
                id: `item-${toId(row.id)}`,
                activity_type: 'item_pledge' as const,
                reference_id: toId(row.id),
                campaign_id: toId(row.campaignId),
                campaign_title: row.campaign.title,
                campaign_slug: row.campaign.slug,
                module_id: toId(row.moduleId),
                module_title: row.module.title,
                module_type: row.module.type,
                status: row.status,
                occurred_at: row.updatedAt,
                meta: {
                    quantity: row.quantity,
                    item_name: row.itemTarget.name,
                    item_unit: row.itemTarget.unit,
                },
            })),
            ...eventRows.map((row) => ({
                id: `event-${toId(row.id)}`,
                activity_type: 'event_registration' as const,
                reference_id: toId(row.id),
                campaign_id: toId(row.campaignId),
                campaign_title: row.campaign.title,
                campaign_slug: row.campaign.slug,
                module_id: toId(row.moduleId),
                module_title: row.module.title,
                module_type: row.module.type,
                status: row.status,
                occurred_at: row.updatedAt,
                meta: {
                    hours: toNumber(row.hours),
                },
            })),
            ...certificateRows.map((row) => ({
                id: `certificate-${toId(row.id)}`,
                activity_type: 'certificate' as const,
                reference_id: toId(row.id),
                campaign_id: toId(row.campaignId),
                campaign_title: row.campaign.title,
                campaign_slug: row.campaign.slug,
                module_id: toId(row.moduleId),
                module_title: row.module?.title ?? 'Chứng nhận',
                module_type: row.module?.type ?? null,
                status: row.status,
                occurred_at: row.updatedAt,
                meta: {
                    certificate_no: row.certificateNo,
                    file_url: row.fileUrl,
                },
            })),
        ].sort(
            (left, right) =>
                new Date(right.occurred_at).getTime() -
                new Date(left.occurred_at).getTime()
        )

        const total = allItems.length
        const items = allItems.slice((page - 1) * limit, page * limit)

        return ApiResponse.success(
            res,
            items,
            'Student activities fetched successfully',
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

studentsRouter.get('/me/donations', async (req, res, next) => {
    try {
        const studentId = BigInt(req.payload!.userId)
        const type = String(req.query.type ?? '').trim().toLowerCase()
        const status = String(req.query.status ?? '').trim().toUpperCase()
        const page = getPositiveIntQuery(req.query.page, 1)
        const limit = getPositiveIntQuery(req.query.limit, 10, 100)

        if (type && !['money', 'item'].includes(type)) {
            return ApiResponse.error(
                res,
                'type must be money or item',
                400,
                { type },
                'STUDENT_DONATION_INVALID_FILTER'
            )
        }

        const [moneyRows, itemRows] = await Promise.all([
            type && type !== 'money'
                ? Promise.resolve([])
                : prismaClient.moneyDonation.findMany({
                      where: {
                          studentId,
                          ...(status && { status: status as any }),
                      },
                      include: {
                          campaign: { select: { title: true, slug: true } },
                          module: { select: { title: true } },
                      },
                  }),
            type && type !== 'item'
                ? Promise.resolve([])
                : prismaClient.itemPledge.findMany({
                      where: {
                          studentId,
                          ...(status && { status: status as any }),
                      },
                      include: {
                          campaign: { select: { title: true, slug: true } },
                          module: { select: { title: true } },
                          itemTarget: { select: { name: true, unit: true } },
                      },
                  }),
        ])

        const allItems = [
            ...moneyRows.map((row) => ({
                id: `money-${toId(row.id)}`,
                donation_type: 'money',
                reference_id: toId(row.id),
                campaign_id: toId(row.campaignId),
                campaign_title: row.campaign.title,
                campaign_slug: row.campaign.slug,
                module_id: toId(row.moduleId),
                module_title: row.module.title,
                status: row.status,
                occurred_at: row.updatedAt,
                meta: {
                    amount: toNumber(row.amount),
                    donor_name: row.donorName,
                },
            })),
            ...itemRows.map((row) => ({
                id: `item-${toId(row.id)}`,
                donation_type: 'item',
                reference_id: toId(row.id),
                campaign_id: toId(row.campaignId),
                campaign_title: row.campaign.title,
                campaign_slug: row.campaign.slug,
                module_id: toId(row.moduleId),
                module_title: row.module.title,
                status: row.status,
                occurred_at: row.updatedAt,
                meta: {
                    quantity: row.quantity,
                    item_name: row.itemTarget.name,
                    item_unit: row.itemTarget.unit,
                    received_quantity: row.receivedQuantity,
                },
            })),
        ].sort(
            (left, right) =>
                new Date(right.occurred_at).getTime() -
                new Date(left.occurred_at).getTime()
        )

        const total = allItems.length
        const items = allItems.slice((page - 1) * limit, page * limit)

        return ApiResponse.success(
            res,
            items,
            'Student donations fetched successfully',
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

studentsRouter.get('/me/certificates', async (req, res, next) => {
    try {
        const studentId = BigInt(req.payload!.userId)
        const page = getPositiveIntQuery(req.query.page, 1)
        const limit = getPositiveIntQuery(req.query.limit, 10, 100)
        const status = String(req.query.status ?? '').trim().toUpperCase()

        const where = {
            studentId,
            ...(status && { status: status as any }),
        }

        const [total, rows] = await Promise.all([
            prismaClient.certificate.count({ where }),
            prismaClient.certificate.findMany({
                where,
                include: {
                    campaign: {
                        select: { title: true, slug: true },
                    },
                    module: {
                        select: { title: true, type: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ])

        return ApiResponse.success(
            res,
            rows.map((row) => ({
                id: toId(row.id),
                certificate_no: row.certificateNo,
                campaign: {
                    id: toId(row.campaignId),
                    title: row.campaign.title,
                    slug: row.campaign.slug,
                },
                module: row.module
                    ? {
                          id: toId(row.moduleId),
                          title: row.module.title,
                          type: row.module.type,
                      }
                    : null,
                status: row.status,
                file_url: row.fileUrl,
                issued_at: row.issuedAt,
                revoked_at: row.revokedAt,
            })),
            'Student certificates fetched successfully',
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

studentsRouter.patch('/me/profile', async (req, res, next) => {
    try {
        const studentId = BigInt(req.payload!.userId)
        const fullName = req.body?.full_name ? String(req.body.full_name).trim() : undefined
        const phone = req.body?.phone ? String(req.body.phone).trim() : undefined
        const classCode = req.body?.class_code ? String(req.body.class_code).trim() : undefined
        const major = req.body?.major ? String(req.body.major).trim() : undefined

        const updated = await prismaClient.student.update({
            where: { id: studentId },
            data: {
                ...(fullName !== undefined && { fullName }),
                ...(phone !== undefined && { phone }),
                ...(classCode !== undefined && { classCode }),
                ...(major !== undefined && { major }),
            },
        })

        return ApiResponse.success(
            res,
            {
                id: toId(updated.id),
                full_name: updated.fullName,
                phone: updated.phone,
                class_code: updated.classCode,
                major: updated.major,
            },
            'Student profile updated successfully'
        )
    } catch (error) {
        next(error)
    }
})

studentsRouter.get('/me/titles', async (req, res, next) => {
    try {
        const studentId = BigInt(req.payload!.userId)
        const student = await prismaClient.student.findUnique({
            where: { id: studentId },
            select: { totalPoints: true, currentTitleId: true },
        })

        if (!student) {
            return ApiResponse.error(
                res,
                'Student not found',
                404,
                undefined,
                'STUDENT_NOT_FOUND'
            )
        }

        const titles = await prismaClient.title.findMany({
            orderBy: { minPoints: 'asc' },
        })

        return ApiResponse.success(
            res,
            titles.map((title) => ({
                id: toId(title.id),
                name: title.name,
                description: title.description,
                min_points: title.minPoints,
                icon_url: title.iconUrl,
                achieved: student.totalPoints >= title.minPoints,
                current: student.currentTitleId === title.id,
            })),
            'Student titles fetched successfully'
        )
    } catch (error) {
        next(error)
    }
})

export default studentsRouter
