import * as authService from 'src/features/auth/auth.service'
import type { UserRole } from 'src/features/auth/types'
import { catalogCampaigns } from 'src/features/catalog/catalog.data'
import * as campaignsService from 'src/features/campaigns/campaigns.service'
import { initialEventRegistrations } from './events.data'
import { EventRegistrationRecord } from './events.types'

let registrationCounter = 100
let eventRegistrationStore: EventRegistrationRecord[] = initialEventRegistrations.map(
    (item) => ({
        ...item,
        student: { ...item.student },
        answers: item.answers ? { ...item.answers } : undefined,
    })
)

const cloneRegistration = (
    item: EventRegistrationRecord
): EventRegistrationRecord => ({
    ...item,
    student: { ...item.student },
    answers: item.answers ? { ...item.answers } : undefined,
})

const findEventModuleEntry = (moduleId: string) => {
    const mutableCampaign = campaignsService.findManagedCampaignByModuleId(moduleId)

    if (mutableCampaign) {
        const mutableModule = mutableCampaign.modules.find(
            (item) => item.id === moduleId && item.type === 'event'
        )

        if (mutableModule) {
            return {
                campaign: mutableCampaign,
                module: mutableModule,
            }
        }
    }

    for (const campaign of catalogCampaigns) {
        const module = campaign.modules.find(
            (item) => item.id === moduleId && item.type === 'event'
        )

        if (module) {
            return { campaign, module }
        }
    }

    return null
}

const eventConfigStore = new Map(
    catalogCampaigns.flatMap((campaign) =>
        campaign.modules
            .filter((module) => module.type === 'event')
            .map((module) => [module.id, { ...module.settings }])
    )
)

const findRegistration = (registrationId: string) =>
    eventRegistrationStore.find((item) => item.id === registrationId) ?? null

const getModuleRegistrations = (moduleId: string) =>
    eventRegistrationStore.filter((item) => item.module_id === moduleId)

export const resetEventStore = () => {
    registrationCounter = 100
    eventRegistrationStore = initialEventRegistrations.map(cloneRegistration)
    eventConfigStore.clear()

    catalogCampaigns.forEach((campaign) => {
        campaign.modules
            .filter((module) => module.type === 'event')
            .forEach((module) => {
                eventConfigStore.set(module.id, { ...module.settings })
            })
    })
}

export const getEventModule = (moduleId: string) => {
    const entry = findEventModuleEntry(moduleId)

    if (!entry) {
        return null
    }

    const registrations = getModuleRegistrations(moduleId)
    const approvedCount = registrations.filter((item) =>
        ['APPROVED', 'CHECKED_IN', 'COMPLETED'].includes(item.status)
    ).length

    return {
        id: entry.module.id,
        campaign_id: entry.campaign.id,
        type: entry.module.type,
        title: entry.module.title,
        description: entry.module.description,
        status: entry.module.status,
        start_at: entry.module.start_at,
        end_at: entry.module.end_at,
        settings_json: {
            ...(eventConfigStore.get(moduleId) ?? entry.module.settings),
        },
        registration_count: registrations.length,
        approved_count: approvedCount,
        campaign: {
            id: entry.campaign.id,
            title: entry.campaign.title,
            slug: entry.campaign.slug,
            status: entry.campaign.status,
        },
    }
}

export const updateEventConfig = (
    moduleId: string,
    payload: {
        location?: string
        quota?: number
        registration_required?: boolean
        checkin_required?: boolean
        benefits?: string[]
    }
) => {
    const entry = findEventModuleEntry(moduleId)

    if (!entry) {
        return null
    }

    const current = {
        ...(eventConfigStore.get(moduleId) ?? entry.module.settings),
    }
    const next = {
        ...current,
        ...(payload.location !== undefined ? { location: payload.location } : {}),
        ...(payload.quota !== undefined ? { quota: payload.quota } : {}),
        ...(payload.registration_required !== undefined
            ? { registration_required: payload.registration_required }
            : {}),
        ...(payload.checkin_required !== undefined
            ? { checkin_required: payload.checkin_required }
            : {}),
        ...(payload.benefits !== undefined
            ? {
                  benefits: [...payload.benefits],
                  benefits_text: payload.benefits.join('\n'),
              }
            : {}),
    }

    eventConfigStore.set(moduleId, next)

    return {
        module_id: moduleId,
        config: { ...next },
    }
}

export const listEventRegistrations = (params: {
    moduleId: string
    status?: string
    q?: string
}) => {
    const normalizedQuery = String(params.q ?? '')
        .trim()
        .toLowerCase()

    return getModuleRegistrations(params.moduleId)
        .filter((item) => !params.status || item.status === params.status)
        .filter((item) => {
            if (!normalizedQuery) {
                return true
            }

            return [
                item.student.full_name,
                item.student.student_code,
                item.student.email,
                String(item.answers?.faculty ?? ''),
                String(item.review_note ?? ''),
            ]
                .join(' ')
                .toLowerCase()
                .includes(normalizedQuery)
        })
        .sort(
            (left, right) =>
                new Date(right.registered_at).getTime() -
                new Date(left.registered_at).getTime()
        )
        .map(cloneRegistration)
}

export const createEventRegistration = async (input: {
    moduleId: string
    userId: string
    role?: UserRole
    answers?: Record<string, unknown>
}) => {
    const entry = findEventModuleEntry(input.moduleId)

    if (!entry) {
        return null
    }

    const user = await authService.getUserById(input.userId, input.role)
    const now = new Date().toISOString()
    const existing = eventRegistrationStore.find(
        (item) =>
            item.module_id === input.moduleId && item.student.id === input.userId
    )

    if (existing) {
        return {
            id: existing.id,
            status: existing.status,
        }
    }

    const registration: EventRegistrationRecord = {
        id: `registration-evt-${registrationCounter++}`,
        campaign_id: entry.campaign.id,
        module_id: input.moduleId,
        student: {
            id: input.userId,
            full_name:
                `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() ||
                String(input.answers?.student_name ?? 'Sinh vien BK'),
            student_code:
                user?.username ??
                String(input.answers?.student_code ?? input.userId),
            email: user?.email ?? `${input.userId}@example.com`,
        },
        status: 'PENDING',
        answers: input.answers ? { ...input.answers } : undefined,
        registered_at: now,
        reviewed_at: null,
        review_note: null,
        checked_in_at: null,
        checked_out_at: null,
        hours: null,
    }

    eventRegistrationStore = [registration, ...eventRegistrationStore]

    return {
        id: registration.id,
        status: registration.status,
    }
}

export const approveEventRegistration = (
    registrationId: string,
    reviewNote?: string
) => {
    const existing = findRegistration(registrationId)

    if (!existing) {
        return null
    }

    const next: EventRegistrationRecord = {
        ...existing,
        status: 'APPROVED',
        reviewed_at: new Date().toISOString(),
        review_note: reviewNote?.trim() || existing.review_note || null,
    }

    eventRegistrationStore = eventRegistrationStore.map((item) =>
        item.id === registrationId ? next : item
    )

    return {
        id: next.id,
        status: next.status,
    }
}

export const rejectEventRegistration = (
    registrationId: string,
    reason?: string
) => {
    const existing = findRegistration(registrationId)

    if (!existing) {
        return null
    }

    const next: EventRegistrationRecord = {
        ...existing,
        status: 'REJECTED',
        reviewed_at: new Date().toISOString(),
        review_note: reason?.trim() || 'Khong dat tieu chi xet duyet',
    }

    eventRegistrationStore = eventRegistrationStore.map((item) =>
        item.id === registrationId ? next : item
    )

    return {
        id: next.id,
        status: next.status,
    }
}

export const checkInEventRegistration = (
    registrationId: string,
    checkedInAt?: string
) => {
    const existing = findRegistration(registrationId)

    if (!existing) {
        return null
    }

    const next: EventRegistrationRecord = {
        ...existing,
        status: 'CHECKED_IN',
        checked_in_at: checkedInAt?.trim() || new Date().toISOString(),
    }

    eventRegistrationStore = eventRegistrationStore.map((item) =>
        item.id === registrationId ? next : item
    )

    return {
        id: next.id,
        status: next.status,
    }
}

export const completeEventRegistration = (
    registrationId: string,
    payload: {
        checked_out_at?: string
        hours?: number
        note?: string
    }
) => {
    const existing = findRegistration(registrationId)

    if (!existing) {
        return null
    }

    const next: EventRegistrationRecord = {
        ...existing,
        status: 'COMPLETED',
        checked_out_at: payload.checked_out_at?.trim() || new Date().toISOString(),
        hours:
            typeof payload.hours === 'number' && Number.isFinite(payload.hours)
                ? payload.hours
                : existing.hours ?? 0,
        review_note: payload.note?.trim() || existing.review_note || null,
    }

    eventRegistrationStore = eventRegistrationStore.map((item) =>
        item.id === registrationId ? next : item
    )

    return {
        id: next.id,
        status: next.status,
    }
}
