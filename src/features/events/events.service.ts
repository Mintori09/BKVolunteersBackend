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
    if (principal?.accountType !== 'STUDENT' || !principal.userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản sinh viên')
    }

    const moduleId = BigInt(moduleIdRaw)
    const module = await eventsRepository.findModuleBaseById(moduleId)

    if (!module || module.type !== 'EVENT') {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Module not found')
    }

    const registration = await eventsRepository.upsertRegistration({
        moduleId,
        campaignId: module.campaignId,
        studentId: BigInt(principal.userId),
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
    if (principal?.accountType !== 'OPERATOR' || !principal.userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Yêu cầu tài khoản operator')
    }

    const registration = await eventsRepository.approveRegistration({
        id: BigInt(idRaw),
        reviewedBy: BigInt(principal.userId),
        note: body.note ?? null,
    })

    return {
        id: serializeId(registration.id)!,
        status: registration.status,
    }
}
