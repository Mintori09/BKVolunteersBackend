import { HttpStatus } from 'src/common/constants'
import { serializeId } from 'src/common/serializers'
import { ApiError } from 'src/utils/ApiError'
import * as eventsRepository from './events.repository'
import {
    EventApproveBody,
    EventApproveOutput,
    EventModuleOutput,
    EventRegisterBody,
    EventRegisterOutput,
} from './types'

const requireOperator = (principal?: { accountType?: string; userId?: string }) => {
    if (principal?.accountType !== 'OPERATOR' || !principal.userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản operator')
    }
}

const requireStudent = (principal?: { accountType?: string; userId?: string }) => {
    if (principal?.accountType !== 'STUDENT' || !principal.userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản sinh viên')
    }
}

export const getEventModule = async (
    moduleIdRaw: string
): Promise<EventModuleOutput> => {
    const module = await eventsRepository.findModuleById(BigInt(moduleIdRaw))

    if (!module || module.type !== 'EVENT') {
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
        approved_count: module.eventRegistrations.filter(
            (item) => item.status === 'APPROVED'
        ).length,
        campaign: {
            id: serializeId(module.campaign.id)!,
            title: module.campaign.title,
            slug: module.campaign.slug,
            status: module.campaign.status,
        },
    }
}

export const registerEvent = async (
    moduleIdRaw: string,
    body: EventRegisterBody,
    principal?: { accountType?: string; userId?: string }
): Promise<EventRegisterOutput> => {
    requireStudent(principal)

    const moduleId = BigInt(moduleIdRaw)
    const module = await eventsRepository.findModuleBaseById(moduleId)

    if (!module || module.type !== 'EVENT') {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Module not found')
    }

    const registration = await eventsRepository.upsertRegistration({
        moduleId,
        campaignId: module.campaignId,
        studentId: BigInt(principal!.userId!),
        answersJson: body.answers_json,
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
    principal?: { accountType?: string; userId?: string }
): Promise<EventApproveOutput> => {
    requireOperator(principal)

    const registration = await eventsRepository.approveRegistration({
        id: BigInt(idRaw),
        reviewedBy: BigInt(principal!.userId!),
        note: body.note ?? null,
    })

    return {
        id: serializeId(registration.id)!,
        status: registration.status,
    }
}

export const rejectEventRegistration = async (
    idRaw: string,
    body: { reason: string },
    principal?: { accountType?: string; userId?: string }
): Promise<EventApproveOutput> => {
    requireOperator(principal)

    const registration = await eventsRepository.rejectRegistration({
        id: BigInt(idRaw),
        reviewedBy: BigInt(principal!.userId!),
        reason: body.reason,
    })

    return {
        id: serializeId(registration.id)!,
        status: registration.status,
    }
}

export const checkInEventRegistration = async (
    idRaw: string,
    body: { checked_in_at?: string },
    principal?: { accountType?: string; userId?: string }
): Promise<EventApproveOutput> => {
    requireOperator(principal)

    const registration = await eventsRepository.checkInRegistration({
        id: BigInt(idRaw),
        checkedInAt: body.checked_in_at ? new Date(body.checked_in_at) : new Date(),
    })

    return {
        id: serializeId(registration.id)!,
        status: registration.status,
    }
}

export const completeEventRegistration = async (
    idRaw: string,
    body: { checked_out_at?: string; hours?: number; note?: string },
    principal?: { accountType?: string; userId?: string }
): Promise<EventApproveOutput> => {
    requireOperator(principal)

    const registration = await eventsRepository.completeRegistration({
        id: BigInt(idRaw),
        checkedOutAt: body.checked_out_at ? new Date(body.checked_out_at) : null,
        hours: body.hours ?? null,
        note: body.note ?? null,
    })

    return {
        id: serializeId(registration.id)!,
        status: registration.status,
    }
}

export const listEventRegistrations = async (
    moduleIdRaw: string,
    query: { status?: string; q?: string; page?: number; limit?: number },
    principal?: { accountType?: string; userId?: string }
) => {
    const moduleId = BigInt(moduleIdRaw)
    const page = Number(query.page ?? 1)
    const limit = Number(query.limit ?? 20)
    const skip = (page - 1) * limit

    const { total, items } = await eventsRepository.findRegistrationsByModuleId({
        moduleId,
        status: query.status,
        q: query.q,
        skip,
        take: limit,
    })

    return {
        items: items.map((item) => ({
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
            registered_at: item.createdAt.toISOString(),
            reviewed_at: item.reviewedAt?.toISOString() ?? null,
            review_note: item.reviewNote ?? null,
            checked_in_at: item.checkedInAt?.toISOString() ?? null,
            checked_out_at: item.checkedOutAt?.toISOString() ?? null,
            hours: item.hours ?? null,
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    }
}
