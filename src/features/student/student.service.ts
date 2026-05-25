import * as studentRepo from './student.repository'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import { serializeId } from 'src/common/serializers'
import {
    StudentProfile,
    UpdateProfileInput,
    StudentTitleDetail,
    StudentCertificateItem,
    StudentActivityItem,
    StudentActivityQuery,
    StudentDashboardSummary,
    StudentDonationItem,
    StudentDonationQuery,
} from './types'

const toApiModuleType = (value: string | null | undefined) => {
    if (!value) return null

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

const paginateItems = <T>(
    items: T[],
    page = 1,
    limit = items.length || 20
) => {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : items.length || 20
    const start = (safePage - 1) * safeLimit
    return items.slice(start, start + safeLimit)
}

const buildMoneyDonationItems = (
    moneyDonations: Awaited<
        ReturnType<typeof studentRepo.findStudentDashboardData>
    >['moneyDonations']
): StudentDonationItem[] =>
    moneyDonations.map((d) => ({
        id: serializeId(d.id)!.toString(),
        donation_type: 'money',
        reference_id: serializeId(d.id)!.toString(),
        campaign_id: serializeId(d.campaignId)!.toString(),
        campaign_title: d.campaign.title,
        campaign_slug: d.campaign.slug,
        module_id: serializeId(d.moduleId)!.toString(),
        module_title: d.module.title,
        status: d.status,
        occurred_at: d.createdAt.toISOString(),
        meta: {
            amount: Number(d.amount),
            donor_name: d.donorName,
            message: d.message,
        },
    }))

const buildItemDonationItems = (
    itemPledges: Awaited<
        ReturnType<typeof studentRepo.findStudentDashboardData>
    >['itemPledges']
): StudentDonationItem[] =>
    itemPledges.map((p) => ({
        id: serializeId(p.id)!.toString(),
        donation_type: 'item',
        reference_id: serializeId(p.id)!.toString(),
        campaign_id: serializeId(p.campaignId)!.toString(),
        campaign_title: p.campaign.title,
        campaign_slug: p.campaign.slug,
        module_id: serializeId(p.moduleId)!.toString(),
        module_title: p.module.title,
        status: p.status,
        occurred_at: (p.receivedAt ?? p.createdAt).toISOString(),
        meta: {
            quantity: p.receivedQuantity ?? p.quantity,
            pledged_quantity: p.quantity,
            item_name: p.itemTarget.name,
            unit: p.itemTarget.unit,
            donor_name: p.donorName,
        },
    }))

const buildStudentActivities = async (
    studentId: string
): Promise<StudentActivityItem[]> => {
    const { moneyDonations, itemPledges, eventRegistrations, certificates } =
        await studentRepo.findStudentDashboardData(studentId)

    const activities: StudentActivityItem[] = [
        ...moneyDonations.map((d) => ({
            id: `money-${serializeId(d.id)}`,
            activity_type: 'money_donation' as const,
            reference_id: serializeId(d.id)!.toString(),
            campaign_id: serializeId(d.campaignId)!.toString(),
            campaign_title: d.campaign.title,
            campaign_slug: d.campaign.slug,
            module_id: serializeId(d.moduleId)!.toString(),
            module_title: d.module.title,
            module_type: toApiModuleType(d.module.type),
            status: d.status,
            occurred_at: d.createdAt.toISOString(),
            summary: `Đóng góp ${Number(d.amount).toLocaleString('vi-VN')}đ`,
            meta: {
                amount: Number(d.amount),
                donor_name: d.donorName,
                message: d.message,
            },
        })),
        ...itemPledges.map((p) => ({
            id: `item-${serializeId(p.id)}`,
            activity_type: 'item_pledge' as const,
            reference_id: serializeId(p.id)!.toString(),
            campaign_id: serializeId(p.campaignId)!.toString(),
            campaign_title: p.campaign.title,
            campaign_slug: p.campaign.slug,
            module_id: serializeId(p.moduleId)!.toString(),
            module_title: p.module.title,
            module_type: toApiModuleType(p.module.type),
            status: p.status,
            occurred_at: (p.receivedAt ?? p.createdAt).toISOString(),
            summary: `${p.receivedQuantity ?? p.quantity} ${p.itemTarget.unit} ${p.itemTarget.name}`,
            meta: {
                quantity: p.quantity,
                received_quantity: p.receivedQuantity,
                item_name: p.itemTarget.name,
                unit: p.itemTarget.unit,
                donor_name: p.donorName,
            },
        })),
        ...eventRegistrations.map((r) => ({
            id: `event-${serializeId(r.id)}`,
            activity_type: 'event_registration' as const,
            reference_id: serializeId(r.id)!.toString(),
            campaign_id: serializeId(r.campaignId)!.toString(),
            campaign_title: r.campaign.title,
            campaign_slug: r.campaign.slug,
            module_id: serializeId(r.moduleId)!.toString(),
            module_title: r.module.title,
            module_type: toApiModuleType(r.module.type),
            status: r.status,
            occurred_at: (r.checkedOutAt ?? r.checkedInAt ?? r.reviewedAt ?? r.createdAt).toISOString(),
            summary:
                r.status === 'COMPLETED'
                    ? `Hoàn thành ${Number(r.hours ?? 0)} giờ`
                    : 'Đăng ký tham gia sự kiện',
            meta: {
                hours: Number(r.hours ?? 0),
                checked_in_at: r.checkedInAt?.toISOString() ?? null,
                checked_out_at: r.checkedOutAt?.toISOString() ?? null,
            },
        })),
        ...certificates.map((c) => ({
            id: `certificate-${serializeId(c.id)}`,
            activity_type: 'certificate' as const,
            reference_id: serializeId(c.id)!.toString(),
            campaign_id: serializeId(c.campaignId)!.toString(),
            campaign_title: c.campaign.title,
            campaign_slug: c.campaign.slug,
            module_id: serializeId(c.moduleId)?.toString() ?? null,
            module_title: c.module?.title ?? c.template.name,
            module_type: null,
            status: c.status,
            occurred_at: (c.issuedAt ?? c.createdAt).toISOString(),
            summary: `Chứng nhận ${c.certificateNo}`,
            meta: {
                certificate_no: c.certificateNo,
                template_name: c.template.name,
            },
        })),
    ]

    return activities.sort(
        (a, b) =>
            new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
    )
}

export const getMyProfile = async (
    studentId: string
): Promise<StudentProfile> => {
    const student = await studentRepo.findByIdWithTitles(studentId)

    if (!student) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
    }

    return {
        id: student.id.toString(),
        studentCode: student.studentCode,
        fullName: student.fullName,
        email: student.email,
        facultyId: student.facultyId.toString(),
        classCode: student.classCode,
        phone: student.phone,
        avatarUrl: student.avatarUrl,
        major: student.major,
        year: student.year,
        totalPoints: student.totalPoints,
        titles: student.currentTitle
            ? [
                  {
                      titleId: student.currentTitle.id.toString(),
                      name: student.currentTitle.name,
                      description: student.currentTitle.description,
                      minPoints: student.currentTitle.minPoints,
                      iconUrl: student.currentTitle.iconUrl,
                      badgeColor: null,
                      unlockedAt: null,
                  },
              ]
            : [],
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
    }
}

export const updateMyProfile = async (
    studentId: string,
    data: UpdateProfileInput
) => {
    const student = await studentRepo.findById(studentId)
    if (!student) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
    }

    return studentRepo.updateProfile(studentId, data)
}

export const getMyTitles = async (
    studentId: string
): Promise<StudentTitleDetail[]> => {
    const student = await studentRepo.findByIdWithTitles(studentId)

    if (!student) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
    }

    if (!student.currentTitle) {
        return []
    }

    return [
        {
            titleId: student.currentTitle.id.toString(),
            name: student.currentTitle.name,
            description: student.currentTitle.description,
            minPoints: student.currentTitle.minPoints,
            iconUrl: student.currentTitle.iconUrl,
            badgeColor: null,
            unlockedAt: null,
        },
    ]
}

export const getMyCertificates = async (
    studentId: string
): Promise<StudentCertificateItem[]> => {
    const certificates = await studentRepo.findCertificatesByStudentId(
        studentId
    )

    return certificates.map((cert) => ({
        id: cert.id.toString(),
        certificateNo: cert.certificateNo,
        campaignId: cert.campaignId.toString(),
        campaignTitle: cert.campaign.title,
        moduleTitle: cert.module?.title ?? null,
        templateName: cert.template.name,
        status: cert.status,
        fileUrl: cert.fileUrl,
        issuedAt: cert.issuedAt?.toISOString() ?? null,
        revokedAt: cert.revokedAt?.toISOString() ?? null,
        createdAt: cert.createdAt.toISOString(),
    }))
}

export const getMyDashboard = async (
    studentId: string
): Promise<StudentDashboardSummary> => {
    const { moneyDonations, itemPledges, eventRegistrations, certificates } =
        await studentRepo.findStudentDashboardData(studentId)
    const activities = await buildStudentActivities(studentId)

    const campaignIds = new Set<string>()

    moneyDonations.forEach((item) => campaignIds.add(item.campaignId.toString()))
    itemPledges.forEach((item) => campaignIds.add(item.campaignId.toString()))
    eventRegistrations.forEach((item) =>
        campaignIds.add(item.campaignId.toString())
    )
    certificates.forEach((item) => campaignIds.add(item.campaignId.toString()))

    const verifiedMoneyDonations = moneyDonations.filter(
        (item) => item.status === 'VERIFIED'
    )
    const receivedPledges = itemPledges.filter((item) => item.status === 'RECEIVED')
    const completedEvents = eventRegistrations.filter(
        (item) => item.status === 'COMPLETED'
    )

    return {
        campaigns_count: campaignIds.size,
        money_amount: verifiedMoneyDonations.reduce(
            (sum, item) => sum + Number(item.amount),
            0
        ),
        money_donations_count: verifiedMoneyDonations.length,
        item_received_quantity: receivedPledges.reduce(
            (sum, item) => sum + Number(item.receivedQuantity ?? 0),
            0
        ),
        item_received_count: receivedPledges.length,
        event_hours: completedEvents.reduce(
            (sum, item) => sum + Number(item.hours ?? 0),
            0
        ),
        event_completed_count: completedEvents.length,
        certificates_count: certificates.length,
        recent_activities: activities.slice(0, 8).map((item) => ({
            id: item.id,
            activity_type: item.activity_type,
            campaign_id: item.campaign_id,
            campaign_title: item.campaign_title,
            campaign_slug: item.campaign_slug,
            module_id: item.module_id,
            module_title: item.module_title,
            status: item.status,
            occurred_at: item.occurred_at,
            summary: item.summary ?? item.campaign_title,
        })),
    }
}

export const getMyActivities = async (
    studentId: string,
    query: StudentActivityQuery
): Promise<StudentActivityItem[]> => {
    const activities = await buildStudentActivities(studentId)
    const filtered = activities.filter((item) => {
        if (query.type && item.activity_type !== query.type) return false
        if (query.status && item.status !== query.status) return false
        return true
    })

    return paginateItems(filtered, query.page, query.limit)
}

export const getMyDonations = async (
    studentId: string,
    query: StudentDonationQuery = {}
): Promise<StudentDonationItem[]> => {
    const { moneyDonations, itemPledges } =
        await studentRepo.findStudentDashboardData(studentId)

    const all = [...buildMoneyDonationItems(moneyDonations), ...buildItemDonationItems(itemPledges)]
        .filter((item) => {
            if (query.type && item.donation_type !== query.type) return false
            if (query.status && item.status !== query.status) return false
            return true
        })
        .sort(
            (a, b) =>
                new Date(b.occurred_at).getTime() -
                new Date(a.occurred_at).getTime()
        )

    return paginateItems(all, query.page, query.limit)
}

export const getStudentById = async (studentId: string) => {
    const student = await studentRepo.findByIdPublic(studentId)

    if (!student) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
    }

    return {
        id: student.id.toString(),
        studentCode: student.studentCode,
        fullName: student.fullName,
        email: student.email,
        facultyId: student.facultyId.toString(),
        classCode: student.classCode,
        totalPoints: student.totalPoints,
        titles: student.currentTitle
            ? [
                  {
                      titleId: student.currentTitle.id.toString(),
                      name: student.currentTitle.name,
                      minPoints: student.currentTitle.minPoints,
                      iconUrl: student.currentTitle.iconUrl,
                      unlockedAt: null,
                  },
              ]
            : [],
    }
}
