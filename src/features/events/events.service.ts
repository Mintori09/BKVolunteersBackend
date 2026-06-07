import { Prisma } from '@prisma/client'
import { prismaClient } from 'src/config'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'
import { mapModuleTypeToLegacy } from 'src/features/catalog/catalog.helpers'
import type { UserRole } from 'src/features/auth/types'

const eventModuleInclude = {
    campaign: true,
    eventConfig: true,
    registrations: {
        include: {
            module: true,
            student: {
                include: {
                    user: true,
                },
            },
            checkins: true,
        },
        orderBy: {
            submittedAt: 'desc' as const,
        },
    },
} as const

type EventModuleRecord = Prisma.PromiseReturnType<typeof findEventModule>
type EventRegistrationRecord =
    NonNullable<EventModuleRecord>['registrations'][number]

type ManagerActor = {
    userId: string
    role: Exclude<UserRole, 'SINHVIEN'>
    managerId: string
    facultyId: number | null
    managedClubId: string | null
}

const findEventModule = async (moduleId: string) =>
    prismaClient.campaignModule.findFirst({
        where: {
            id: moduleId,
            deletedAt: null,
            moduleType: 'EVENT',
        },
        include: eventModuleInclude,
    })

const getStudentByUserId = async (userId: string) => {
    const student = await prismaClient.student.findUnique({
        where: {
            userId,
        },
        include: {
            user: true,
        },
    })

    if (!student) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Khong tim thay ho so sinh vien'
        )
    }

    return student
}

const getManagerByUserId = async (userId: string) => {
    const manager = await prismaClient.managerAccount.findUnique({
        where: {
            userId,
        },
    })

    if (!manager) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Khong tim thay tai khoan quan ly'
        )
    }

    return manager
}

const getManagerActor = async (
    userId: string,
    role: UserRole
): Promise<ManagerActor> => {
    if (role === 'SINHVIEN') {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Sinh vien khong duoc phep thuc hien thao tac nay'
        )
    }

    const manager = await getManagerByUserId(userId)

    return {
        userId,
        role,
        managerId: manager.id,
        facultyId: manager.facultyId,
        managedClubId: manager.managedClubId ?? null,
    }
}

const assertCanManageCampaign = (
    actor: ManagerActor,
    campaign: {
        organizerManagerId: string
        facultyId: number | null
        clubId: string | null
    }
) => {
    if (actor.role === 'DOANTRUONG') {
        return
    }

    if (campaign.organizerManagerId === actor.managerId) {
        return
    }

    if (
        actor.role === 'CLB' &&
        actor.managedClubId &&
        campaign.clubId === actor.managedClubId
    ) {
        return
    }

    if (
        actor.role === 'LCD' &&
        actor.facultyId &&
        campaign.facultyId === actor.facultyId
    ) {
        return
    }

    throw new ApiError(
        HttpStatus.FORBIDDEN,
        'Ban khong duoc phep thao tac voi hang muc su kien nay'
    )
}

const mapRegistration = (item: EventRegistrationRecord) => {
    const latestCheckin = item.checkins
        .slice()
        .sort(
            (
                left: EventRegistrationRecord['checkins'][number],
                right: EventRegistrationRecord['checkins'][number]
            ) =>
                new Date(right.checkedInAt).getTime() -
                new Date(left.checkedInAt).getTime()
        )[0]

    const status =
        item.status === 'COMPLETED'
            ? 'COMPLETED'
            : latestCheckin && !latestCheckin.checkedOutAt
              ? 'CHECKED_IN'
              : item.status

    const hours = latestCheckin?.checkedOutAt
        ? Number(
              (
                  (new Date(latestCheckin.checkedOutAt).getTime() -
                      new Date(latestCheckin.checkedInAt).getTime()) /
                  (1000 * 60 * 60)
              ).toFixed(1)
          )
        : null

    return {
        id: item.id,
        campaign_id: item.module.campaignId,
        module_id: item.moduleId,
        student: {
            id: item.student.userId,
            full_name: item.student.fullName,
            student_code: item.student.mssv,
            email: item.student.user.email,
        },
        status,
        answers: undefined,
        registered_at: item.submittedAt.toISOString(),
        reviewed_at: item.reviewedAt?.toISOString() ?? null,
        review_note: item.rejectionReason ?? item.completionNote ?? null,
        checked_in_at: latestCheckin?.checkedInAt.toISOString() ?? null,
        checked_out_at: latestCheckin?.checkedOutAt?.toISOString() ?? null,
        hours,
    }
}

export const resetEventStore = async () => {
    await prismaClient.checkin.deleteMany({
        where: {
            registrationId: {
                in: ['registration-evt-3', 'registration-evt-4'],
            },
        },
    })

    await prismaClient.moduleRegistration.deleteMany({
        where: {
            moduleId: 'module-event-3',
            id: {
                notIn: ['registration-evt-3', 'registration-evt-4'],
            },
        },
    })

    await prismaClient.moduleRegistration.update({
        where: {
            id: 'registration-evt-3',
        },
        data: {
            status: 'PENDING',
            reviewedAt: null,
            rejectionReason: null,
            completionNote: null,
        },
    })

    await prismaClient.moduleRegistration.update({
        where: {
            id: 'registration-evt-4',
        },
        data: {
            status: 'PENDING',
            reviewedAt: null,
            rejectionReason: null,
            completionNote: null,
        },
    })
}

export const getEventModule = async (moduleId: string) => {
    const entry = await findEventModule(moduleId)

    if (!entry) {
        return null
    }

    const approvedCount = entry.registrations.filter((item) =>
        ['APPROVED', 'COMPLETED'].includes(item.status)
    ).length

    return {
        id: entry.id,
        campaign_id: entry.campaignId,
        type: mapModuleTypeToLegacy(entry.moduleType),
        title: entry.title,
        description: entry.shortDescription,
        status: entry.status,
        start_at: entry.moduleStartAt.toISOString(),
        end_at: entry.moduleEndAt.toISOString(),
        settings_json: {
            location: entry.eventConfig?.eventLocation ?? null,
            quota: entry.eventConfig?.maxAttendees ?? null,
            registration_required: true,
            checkin_required: entry.eventConfig?.checkinEnabled ?? false,
            benefits_text: entry.eventConfig?.eventAgenda ?? null,
        },
        registration_count: entry.registrations.length,
        approved_count: approvedCount,
        campaign: {
            id: entry.campaign.id,
            title: entry.campaign.title,
            slug: entry.campaign.title,
            status: entry.campaign.status,
        },
    }
}

export const updateEventConfig = async (
    moduleId: string,
    payload: {
        location?: string
        quota?: number
        registration_required?: boolean
        checkin_required?: boolean
        benefits?: string[]
    },
    actor: {
        userId: string
        role: UserRole
    }
) => {
    const entry = await findEventModule(moduleId)

    if (!entry) {
        return null
    }

    const managerActor = await getManagerActor(actor.userId, actor.role)
    assertCanManageCampaign(managerActor, entry.campaign)

    const updated = await prismaClient.eventModuleConfig.update({
        where: {
            moduleId,
        },
        data: {
            ...(payload.location !== undefined
                ? { eventLocation: payload.location }
                : {}),
            ...(payload.quota !== undefined
                ? { maxAttendees: payload.quota }
                : {}),
            ...(payload.checkin_required !== undefined
                ? { checkinEnabled: payload.checkin_required }
                : {}),
            ...(payload.benefits !== undefined
                ? { eventAgenda: payload.benefits.join('\n') }
                : {}),
        },
    })

    return {
        module_id: moduleId,
        config: {
            location: updated.eventLocation,
            quota: updated.maxAttendees,
            registration_required: payload.registration_required ?? true,
            checkin_required: updated.checkinEnabled,
            benefits: payload.benefits ?? [],
            benefits_text: updated.eventAgenda,
        },
    }
}

export const listEventRegistrations = async (params: {
    moduleId: string
    status?: string
    q?: string
    actor: {
        userId: string
        role: UserRole
    }
}) => {
    const module = await findEventModule(params.moduleId)

    if (!module) {
        return []
    }

    const managerActor = await getManagerActor(
        params.actor.userId,
        params.actor.role
    )
    assertCanManageCampaign(managerActor, module.campaign)

    const normalizedQuery = String(params.q ?? '')
        .trim()
        .toLowerCase()

    return module.registrations
        .map((item) => ({
            ...item,
            module,
        }))
        .map(mapRegistration)
        .filter((item) => !params.status || item.status === params.status)
        .filter((item) => {
            if (!normalizedQuery) {
                return true
            }

            return [
                item.student.full_name,
                item.student.student_code,
                item.student.email,
                item.review_note ?? '',
            ]
                .join(' ')
                .toLowerCase()
                .includes(normalizedQuery)
        })
}

export const createEventRegistration = async (input: {
    moduleId: string
    userId: string
    role?: UserRole
    answers?: Record<string, unknown>
}) => {
    const entry = await findEventModule(input.moduleId)

    if (!entry) {
        return null
    }

    const student = await getStudentByUserId(input.userId)
    const existing = await prismaClient.moduleRegistration.findFirst({
        where: {
            moduleId: input.moduleId,
            studentId: student.id,
            registrationType: 'EVENT',
        },
    })

    if (existing) {
        return {
            id: existing.id,
            status: existing.status,
        }
    }

    const created = await prismaClient.moduleRegistration.create({
        data: {
            moduleId: input.moduleId,
            studentId: student.id,
            registrationType: 'EVENT',
            status: 'PENDING',
        },
    })

    await prismaClient.studentNotification.create({
        data: {
            studentId: student.id,
            type: 'REGISTRATION',
            title: 'Đăng ký sự kiện thành công',
            message: `Bạn đã đăng ký ${entry.title} và đang chờ duyệt`,
            targetType: 'REGISTRATION',
            targetId: created.id,
        },
    })

    return {
        id: created.id,
        status: created.status,
    }
}

export const approveEventRegistration = async (
    registrationId: string,
    reviewNote?: string,
    actor?: {
        userId: string
        role: UserRole
    }
) => {
    const registration = await prismaClient.moduleRegistration.findUnique({
        where: {
            id: registrationId,
        },
        include: {
            student: true,
            module: {
                include: {
                    campaign: true,
                },
            },
        },
    })

    if (!registration) {
        return null
    }

    if (!actor) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chua xac thuc nguoi dung')
    }

    const managerActor = await getManagerActor(actor.userId, actor.role)
    assertCanManageCampaign(managerActor, registration.module.campaign)

    await prismaClient.moduleRegistration.update({
        where: {
            id: registrationId,
        },
        data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            rejectionReason: null,
            completionNote: reviewNote ?? null,
        },
    })

    await prismaClient.studentNotification.create({
        data: {
            studentId: registration.studentId,
            type: 'REGISTRATION',
            title: 'Đăng ký đã được duyệt',
            message: 'Đăng ký tham gia sự kiện của bạn đã được phê duyệt',
            targetType: 'REGISTRATION',
            targetId: registrationId,
        },
    })

    return {
        id: registrationId,
        status: 'APPROVED',
    }
}

export const rejectEventRegistration = async (
    registrationId: string,
    reason?: string,
    actor?: {
        userId: string
        role: UserRole
    }
) => {
    const registration = await prismaClient.moduleRegistration.findUnique({
        where: {
            id: registrationId,
        },
        include: {
            student: true,
            module: {
                include: {
                    campaign: true,
                },
            },
        },
    })

    if (!registration) {
        return null
    }

    if (!actor) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chua xac thuc nguoi dung')
    }

    const managerActor = await getManagerActor(actor.userId, actor.role)
    assertCanManageCampaign(managerActor, registration.module.campaign)

    await prismaClient.moduleRegistration.update({
        where: {
            id: registrationId,
        },
        data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
            rejectionReason: reason?.trim() || 'Cần bổ sung thêm thông tin',
        },
    })

    await prismaClient.studentNotification.create({
        data: {
            studentId: registration.studentId,
            type: 'REGISTRATION',
            title: 'Đăng ký chưa được duyệt',
            message: reason?.trim() || 'Đăng ký sự kiện của bạn đã bị từ chối',
            targetType: 'REGISTRATION',
            targetId: registrationId,
        },
    })

    return {
        id: registrationId,
        status: 'REJECTED',
    }
}

export const checkInEventRegistration = async (
    registrationId: string,
    checkedInAt?: string,
    actor?: {
        userId: string
        role: UserRole
    }
) => {
    const registration = await prismaClient.moduleRegistration.findUnique({
        where: {
            id: registrationId,
        },
        include: {
            module: {
                include: {
                    campaign: true,
                },
            },
        },
    })

    if (!registration) {
        return null
    }

    if (!actor) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chua xac thuc nguoi dung')
    }

    const managerActor = await getManagerActor(actor.userId, actor.role)
    assertCanManageCampaign(managerActor, registration.module.campaign)

    await prismaClient.checkin.create({
        data: {
            registrationId,
            checkedById: managerActor.managerId,
            method: 'MANUAL',
            checkedInAt: checkedInAt ? new Date(checkedInAt) : new Date(),
        },
    })

    return {
        id: registrationId,
        status: 'CHECKED_IN',
    }
}

export const completeEventRegistration = async (
    registrationId: string,
    payload: {
        checked_out_at?: string
        hours?: number
        note?: string
        actor?: {
            userId: string
            role: UserRole
        }
    }
) => {
    const registration = await prismaClient.moduleRegistration.findUnique({
        where: {
            id: registrationId,
        },
        include: {
            checkins: {
                orderBy: {
                    checkedInAt: 'desc',
                },
            },
            student: true,
            module: {
                include: {
                    campaign: true,
                },
            },
        },
    })

    if (!registration) {
        return null
    }

    if (!payload.actor) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chua xac thuc nguoi dung')
    }

    const managerActor = await getManagerActor(
        payload.actor.userId,
        payload.actor.role
    )
    assertCanManageCampaign(managerActor, registration.module.campaign)

    const latestCheckin = registration.checkins[0]
    const checkedOutAt = payload.checked_out_at
        ? new Date(payload.checked_out_at)
        : payload.hours && latestCheckin
          ? new Date(
                new Date(latestCheckin.checkedInAt).getTime() +
                    payload.hours * 60 * 60 * 1000
            )
          : new Date()

    if (latestCheckin && !latestCheckin.checkedOutAt) {
        await prismaClient.checkin.update({
            where: {
                id: latestCheckin.id,
            },
            data: {
                checkedOutAt,
            },
        })
    }

    await prismaClient.moduleRegistration.update({
        where: {
            id: registrationId,
        },
        data: {
            status: 'COMPLETED',
            completionNote: payload.note ?? registration.completionNote,
        },
    })

    await prismaClient.studentNotification.create({
        data: {
            studentId: registration.studentId,
            type: 'REGISTRATION',
            title: 'Đã ghi nhận hoàn thành sự kiện',
            message:
                'Kết quả tham gia sự kiện của bạn đã được cập nhật hoàn thành',
            targetType: 'REGISTRATION',
            targetId: registrationId,
        },
    })

    return {
        id: registrationId,
        status: 'COMPLETED',
    }
}
