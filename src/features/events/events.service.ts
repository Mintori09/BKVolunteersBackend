import { HttpStatus } from 'src/common/constants'
import { serializeId } from 'src/common/serializers'
import { ApiError } from 'src/utils/ApiError'
import * as notificationService from 'src/features/notification/notification.service'
import * as eventsRepository from './events.repository'
import {
    EventApproveBody,
    EventApproveOutput,
    EventConfigBody,
    EventConfigOutput,
    EventModuleOutput,
    EventRegisterBody,
    EventRegisterOutput,
} from './types'

type Principal = {
    accountType?: string
    userId?: string
    role?: string
    organizationId?: string | null
}

const requireOperator = (principal?: Principal) => {
    if (principal?.accountType !== 'OPERATOR' || !principal.userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản operator')
    }

    return principal
}

const requireStudent = (principal?: Principal) => {
    if (principal?.accountType !== 'STUDENT' || !principal.userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản sinh viên')
    }

    return principal
}

const assertOperatorScope = (
    principal: Principal,
    organizationId: bigint | null | undefined
) => {
    if (principal.role === 'DOANTRUONG' || principal.role === 'LCD') {
        return
    }

    if (!principal.organizationId || !organizationId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Không có quyền vận hành sự kiện này')
    }

    if (principal.organizationId !== organizationId.toString()) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Không có quyền vận hành sự kiện này')
    }
}

const getEventConfig = (settingsJson: unknown): Record<string, unknown> => {
    if (!settingsJson || typeof settingsJson !== 'object') {
        return {}
    }

    return settingsJson as Record<string, unknown>
}

const isEventModuleType = (value: string | null | undefined) =>
    value === 'EVENT' || value === 'event'

const normalizeBenefits = (benefits: string[]) => {
    const deduped = new Set<string>()

    benefits.forEach((item) => {
        const normalized = item.trim()
        if (normalized) {
            deduped.add(normalized)
        }
    })

    return Array.from(deduped)
}

const ensureRegistrationWindowOpen = (module: {
    status: string
    startAt: Date
    endAt: Date
    campaign: { status: string }
}) => {
    if (!['PUBLISHED', 'ONGOING'].includes(module.campaign.status)) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chiến dịch chưa mở để đăng ký sự kiện'
        )
    }

    if (['CLOSED', 'CANCELLED'].includes(module.status)) {
        throw new ApiError(HttpStatus.CONFLICT, 'Sự kiện đã đóng đăng ký')
    }

    const now = Date.now()
    if (now < module.startAt.getTime()) {
        throw new ApiError(HttpStatus.CONFLICT, 'Sự kiện chưa mở đăng ký')
    }

    if (now > module.endAt.getTime()) {
        throw new ApiError(HttpStatus.CONFLICT, 'Sự kiện đã kết thúc')
    }
}

const getQuota = (config: Record<string, unknown>) => {
    const quota = Number(config.quota ?? 0)
    return Number.isFinite(quota) && quota > 0 ? quota : 0
}

const getRegistrationRequired = (config: Record<string, unknown>) =>
    config.registration_required !== false

const getCheckinRequired = (config: Record<string, unknown>) =>
    config.checkin_required !== false

const ensureQuotaAvailable = async (
    moduleId: bigint,
    quota: number,
    statuses: string[]
) => {
    if (!quota) {
        return
    }

    const current = await eventsRepository.countRegistrationsByModule({
        moduleId,
        statuses,
    })

    if (current >= quota) {
        throw new ApiError(HttpStatus.CONFLICT, 'Sự kiện đã đủ số lượng đăng ký')
    }
}

export const getEventModule = async (
    moduleIdRaw: string
): Promise<EventModuleOutput> => {
    const module = await eventsRepository.findModuleById(BigInt(moduleIdRaw))

    if (!module || !isEventModuleType(module.type)) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Module not found')
    }

    return {
        id: serializeId(module.id)!,
        campaign_id: serializeId(module.campaignId)!,
        type: module.type,
        title: module.title,
        description: module.description,
        status: module.status,
        start_at: module.startAt,
        end_at: module.endAt,
        settings_json: module.settingsJson,
        registration_count: module.eventRegistrations.length,
        approved_count: module.eventRegistrations.filter((item) =>
            ['APPROVED', 'CHECKED_IN', 'COMPLETED'].includes(item.status)
        ).length,
        campaign: {
            id: serializeId(module.campaign.id)!,
            title: module.campaign.title,
            slug: module.campaign.slug,
            status: module.campaign.status,
        },
    }
}

export const updateEventConfig = async (
    moduleIdRaw: string,
    body: EventConfigBody,
    principal?: Principal
): Promise<EventConfigOutput> => {
    const operator = requireOperator(principal)
    const module = await eventsRepository.findModuleBaseById(BigInt(moduleIdRaw))

    if (!module || !isEventModuleType(module.type)) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Module not found')
    }

    assertOperatorScope(operator, module.campaign.organizationId)

    const config = {
        ...getEventConfig(module.settingsJson),
        location: body.location,
        quota: body.quota,
        registration_required: body.registration_required,
        checkin_required: body.checkin_required,
        benefits: normalizeBenefits(body.benefits),
    }

    const updated = await eventsRepository.updateModuleConfig({
        moduleId: module.id,
        settingsJson: config,
    })

    return {
        module_id: serializeId(updated.id)!,
        config: getEventConfig(updated.settingsJson),
    }
}

export const registerEvent = async (
    moduleIdRaw: string,
    body: EventRegisterBody,
    principal?: Principal
): Promise<EventRegisterOutput> => {
    const student = requireStudent(principal)

    const moduleId = BigInt(moduleIdRaw)
    const module = await eventsRepository.findModuleBaseById(moduleId)

    if (!module || !isEventModuleType(module.type)) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Module not found')
    }

    ensureRegistrationWindowOpen(module)

    const existing = await eventsRepository.findRegistrationByModuleAndStudent({
        moduleId,
        studentId: BigInt(student.userId!),
    })

    if (existing) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Bạn đã đăng ký sự kiện này trước đó'
        )
    }

    const config = getEventConfig(module.settingsJson)
    const quota = getQuota(config)

    await ensureQuotaAvailable(moduleId, quota, [
        'PENDING',
        'APPROVED',
        'CHECKED_IN',
        'COMPLETED',
    ])

    const status = getRegistrationRequired(config) ? 'PENDING' : 'APPROVED'
    const answersJson = body.answers_json ?? body.answers ?? null

    const registration = await eventsRepository.createRegistration({
        moduleId,
        campaignId: module.campaignId,
        studentId: BigInt(student.userId!),
        answersJson,
        status,
    })

    return {
        id: serializeId(registration.id)!,
        status: registration.status,
        module_id: serializeId(registration.moduleId)!,
    }
}

export const approveEventRegistration = async (
    idRaw: string,
    body: EventApproveBody,
    principal?: Principal
): Promise<EventApproveOutput> => {
    const operator = requireOperator(principal)
    const registration = await eventsRepository.findRegistrationById(BigInt(idRaw))

    if (!registration) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Registration not found')
    }

    assertOperatorScope(operator, registration.campaign.organizationId)

    if (registration.status !== 'PENDING') {
        throw new ApiError(HttpStatus.CONFLICT, 'Đăng ký không ở trạng thái chờ duyệt')
    }

    const config = getEventConfig(registration.module.settingsJson)
    await ensureQuotaAvailable(registration.module.id, getQuota(config), [
        'APPROVED',
        'CHECKED_IN',
        'COMPLETED',
    ])

    const updated = await eventsRepository.approveRegistration({
        id: registration.id,
        reviewedBy: BigInt(operator.userId!),
        note: body.review_note ?? body.note ?? null,
    })

    await notificationService.createForStudent({
        studentId: registration.student.id.toString(),
        type: 'PARTICIPANT_APPROVED',
        title: 'Đăng ký sự kiện đã được duyệt',
        message: `Đăng ký ${registration.module.title} của bạn đã được duyệt.`,
        dataJson: {
            registration_id: serializeId(registration.id)!,
            campaign_id: serializeId(registration.campaign.id)!,
            module_id: serializeId(registration.module.id)!,
        },
    })

    return {
        id: serializeId(updated.id)!,
        status: updated.status,
    }
}

export const rejectEventRegistration = async (
    idRaw: string,
    body: { reason: string },
    principal?: Principal
): Promise<EventApproveOutput> => {
    const operator = requireOperator(principal)
    const registration = await eventsRepository.findRegistrationById(BigInt(idRaw))

    if (!registration) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Registration not found')
    }

    assertOperatorScope(operator, registration.campaign.organizationId)

    if (!['PENDING', 'APPROVED'].includes(registration.status)) {
        throw new ApiError(HttpStatus.CONFLICT, 'Đăng ký không ở trạng thái có thể từ chối')
    }

    const updated = await eventsRepository.rejectRegistration({
        id: registration.id,
        reviewedBy: BigInt(operator.userId!),
        reason: body.reason,
    })

    await notificationService.createForStudent({
        studentId: registration.student.id.toString(),
        type: 'PARTICIPANT_REJECTED',
        title: 'Đăng ký sự kiện bị từ chối',
        message: body.reason,
        dataJson: {
            registration_id: serializeId(registration.id)!,
            campaign_id: serializeId(registration.campaign.id)!,
            module_id: serializeId(registration.module.id)!,
        },
    })

    return {
        id: serializeId(updated.id)!,
        status: updated.status,
    }
}

export const checkInEventRegistration = async (
    idRaw: string,
    body: { checked_in_at?: string },
    principal?: Principal
): Promise<EventApproveOutput> => {
    const operator = requireOperator(principal)
    const registration = await eventsRepository.findRegistrationById(BigInt(idRaw))

    if (!registration) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Registration not found')
    }

    assertOperatorScope(operator, registration.campaign.organizationId)

    if (registration.status !== 'APPROVED') {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Chỉ có thể check-in đăng ký đã được duyệt'
        )
    }

    const updated = await eventsRepository.checkInRegistration({
        id: registration.id,
        checkedInAt: body.checked_in_at ? new Date(body.checked_in_at) : new Date(),
    })

    await notificationService.createForStudent({
        studentId: registration.student.id.toString(),
        type: 'PARTICIPANT_CHECKED_IN',
        title: 'Đã check-in sự kiện',
        message: `${registration.module.title} đã ghi nhận check-in của bạn.`,
        dataJson: {
            registration_id: serializeId(registration.id)!,
            campaign_id: serializeId(registration.campaign.id)!,
            module_id: serializeId(registration.module.id)!,
        },
    })

    return {
        id: serializeId(updated.id)!,
        status: updated.status,
    }
}

export const completeEventRegistration = async (
    idRaw: string,
    body: { checked_out_at?: string; hours?: number; note?: string },
    principal?: Principal
): Promise<EventApproveOutput> => {
    const operator = requireOperator(principal)
    const registration = await eventsRepository.findRegistrationById(BigInt(idRaw))

    if (!registration) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Registration not found')
    }

    assertOperatorScope(operator, registration.campaign.organizationId)

    const config = getEventConfig(registration.module.settingsJson)
    const checkinRequired = getCheckinRequired(config)

    if (checkinRequired && registration.status !== 'CHECKED_IN') {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Sự kiện yêu cầu check-in trước khi hoàn thành'
        )
    }

    if (!checkinRequired && !['APPROVED', 'CHECKED_IN'].includes(registration.status)) {
        throw new ApiError(
            HttpStatus.CONFLICT,
            'Đăng ký không ở trạng thái có thể hoàn thành'
        )
    }

    const updated = await eventsRepository.completeRegistration({
        id: registration.id,
        checkedOutAt: body.checked_out_at ? new Date(body.checked_out_at) : null,
        hours: body.hours ?? null,
        note: body.note ?? null,
    })

    await notificationService.createForStudent({
        studentId: registration.student.id.toString(),
        type: 'PARTICIPANT_COMPLETED',
        title: 'Đã ghi nhận hoàn thành sự kiện',
        message: `${registration.module.title} đã được ghi nhận hoàn thành.`,
        dataJson: {
            registration_id: serializeId(registration.id)!,
            campaign_id: serializeId(registration.campaign.id)!,
            module_id: serializeId(registration.module.id)!,
            hours: body.hours ?? null,
        },
    })

    return {
        id: serializeId(updated.id)!,
        status: updated.status,
    }
}

export const listEventRegistrations = async (
    moduleIdRaw: string,
    query: { status?: string; q?: string; page?: number; limit?: number },
    principal?: Principal
) => {
    const operator = requireOperator(principal)
    const module = await eventsRepository.findModuleBaseById(BigInt(moduleIdRaw))

    if (!module || !isEventModuleType(module.type)) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Module not found')
    }

    assertOperatorScope(operator, module.campaign.organizationId)

    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 100)
    const skip = (page - 1) * limit

    const { items } = await eventsRepository.findRegistrationsByModuleId({
        moduleId: module.id,
        status: query.status,
        q: query.q,
        skip,
        take: limit,
    })

    return items.map((item) => ({
        id: serializeId(item.id)!.toString(),
        campaign_id: serializeId(item.campaignId)!.toString(),
        module_id: serializeId(item.moduleId)!.toString(),
        student: {
            id: serializeId(item.studentId)!.toString(),
            full_name: item.student.fullName,
            student_code: item.student.studentCode,
            email: item.student.email,
        },
        status: item.status,
        answers: (item.answersJson as Record<string, unknown> | null) ?? undefined,
        registered_at: item.createdAt.toISOString(),
        reviewed_at: item.reviewedAt?.toISOString() ?? null,
        review_note: item.reviewNote ?? null,
        checked_in_at: item.checkedInAt?.toISOString() ?? null,
        checked_out_at: item.checkedOutAt?.toISOString() ?? null,
        hours: item.hours ? Number(item.hours) : null,
    }))
}
