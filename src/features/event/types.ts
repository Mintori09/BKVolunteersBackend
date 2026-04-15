import { ParticipantStatus } from '@prisma/client'

export type { ParticipantStatus }

export interface CreateEventInput {
    location: string
    maxParticipants: number
    registrationStart: Date
    registrationEnd: Date
    eventStart: Date
    eventEnd: Date
}

export interface UpdateEventInput {
    location?: string
    maxParticipants?: number
    registrationStart?: Date
    registrationEnd?: Date
    eventStart?: Date
    eventEnd?: Date
}

export interface ApproveParticipantInput {
    comment?: string
}

export interface RejectParticipantInput {
    reason: string
}

export interface SendCertificateInput {
    certificateUrl: string
    points?: number
}

export interface BulkCertificateInput {
    pointsPerParticipant?: number
}

export interface GetParticipantsQuery {
    status?: ParticipantStatus
    isCheckedIn?: boolean
    page?: number
    limit?: number
}

export interface GetMyParticipantsQuery {
    status?: ParticipantStatus
    page?: number
    limit?: number
}

export interface EventOutput {
    id: number
    campaignId: string
    location: string
    maxParticipants: number
    registrationStart: Date
    registrationEnd: Date
    eventStart: Date
    eventEnd: Date
    createdAt: Date
    updatedAt: Date
}

export interface EventDetailOutput extends EventOutput {
    campaign: {
        id: string
        title: string
        scope: string
        status: string
        facultyId: number | null
        creatorId: string
    }
    _count?: {
        participants: number
    }
}

export interface ParticipantOutput {
    id: string
    eventId: number
    studentId: string
    status: ParticipantStatus
    isCheckedIn: boolean
    certificateUrl: string | null
    createdAt: Date
    updatedAt: Date
}

export interface ParticipantWithStudentOutput extends ParticipantOutput {
    student: {
        id: string
        mssv: string
        fullName: string
        email: string
        phone: string | null
        className: string | null
        faculty: {
            id: number
            code: string
            name: string
        } | null
    }
}

export interface ParticipantWithEventOutput extends ParticipantOutput {
    event: {
        id: number
        location: string
        eventStart: Date
        eventEnd: Date
        campaign: {
            id: string
            title: string
        }
    }
}

export interface BulkCertificateResult {
    successCount: number
    failedCount: number
    failedParticipants: Array<{
        participantId: string
        error: string
    }>
}

export interface PaginatedResult<T> {
    data: T[]
    meta: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}
