import { prismaClient } from 'src/config'
import { ParticipantStatus } from '@prisma/client'
import {
    CreateEventInput,
    UpdateEventInput,
    GetParticipantsQuery,
    GetMyParticipantsQuery,
} from './types'

export const findEventById = async (eventId: number) => {
    return prismaClient.eventCampaign.findUnique({
        where: { id: eventId },
        include: {
            campaign: {
                select: {
                    id: true,
                    title: true,
                    scope: true,
                    status: true,
                    creatorId: true,
                    creator: {
                        select: {
                            id: true,
                            facultyId: true,
                        },
                    },
                },
            },
        },
    })
}

export const findEventByCampaignId = async (campaignId: string) => {
    return prismaClient.eventCampaign.findUnique({
        where: { campaignId },
        include: {
            campaign: {
                select: {
                    id: true,
                    creatorId: true,
                    status: true,
                },
            },
        },
    })
}

export const findEventsByCampaignId = async (campaignId: string) => {
    return prismaClient.eventCampaign.findMany({
        where: { campaignId },
        include: {
            _count: {
                select: { participants: true },
            },
        },
        orderBy: { eventStart: 'asc' },
    })
}

export const createEvent = async (
    campaignId: string,
    data: CreateEventInput
) => {
    return prismaClient.eventCampaign.create({
        data: {
            campaignId,
            location: data.location,
            maxParticipants: data.maxParticipants,
            registrationStart: data.registrationStart,
            registrationEnd: data.registrationEnd,
            eventStart: data.eventStart,
            eventEnd: data.eventEnd,
        },
    })
}

export const updateEvent = async (eventId: number, data: UpdateEventInput) => {
    return prismaClient.eventCampaign.update({
        where: { id: eventId },
        data,
    })
}

export const deleteEvent = async (eventId: number) => {
    return prismaClient.eventCampaign.delete({
        where: { id: eventId },
    })
}

export const findParticipantById = async (id: string) => {
    return prismaClient.participant.findUnique({
        where: { id },
        include: {
            event: {
                include: {
                    campaign: {
                        select: {
                            id: true,
                            title: true,
                            creatorId: true,
                        },
                    },
                },
            },
            student: {
                include: {
                    faculty: true,
                },
            },
        },
    })
}

export const findParticipantByEventAndStudent = async (
    eventId: number,
    studentId: string
) => {
    return prismaClient.participant.findUnique({
        where: {
            eventId_studentId: { eventId, studentId },
        },
    })
}

export const countParticipantsByEvent = async (
    eventId: number,
    statuses?: ParticipantStatus[]
) => {
    return prismaClient.participant.count({
        where: {
            eventId,
            ...(statuses && { status: { in: statuses } }),
        },
    })
}

export const findParticipantsByEvent = async (
    eventId: number,
    query: GetParticipantsQuery
) => {
    const { status, isCheckedIn, page = 1, limit = 10 } = query
    const skip = (page - 1) * limit

    const where = {
        eventId,
        ...(status && { status }),
        ...(isCheckedIn !== undefined && { isCheckedIn }),
    }

    const [data, total] = await Promise.all([
        prismaClient.participant.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                student: {
                    select: {
                        id: true,
                        mssv: true,
                        fullName: true,
                        email: true,
                        phone: true,
                        className: true,
                        faculty: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        }),
        prismaClient.participant.count({ where }),
    ])

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    }
}

export const findParticipantsByStudent = async (
    studentId: string,
    query: GetMyParticipantsQuery
) => {
    const { status, page = 1, limit = 10 } = query
    const skip = (page - 1) * limit

    const where = {
        studentId,
        ...(status && { status }),
    }

    const [data, total] = await Promise.all([
        prismaClient.participant.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                event: {
                    select: {
                        id: true,
                        location: true,
                        eventStart: true,
                        eventEnd: true,
                        campaign: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
        }),
        prismaClient.participant.count({ where }),
    ])

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    }
}

export const findParticipantsForBulkCertificate = async (eventId: number) => {
    return prismaClient.participant.findMany({
        where: {
            eventId,
            isCheckedIn: true,
            certificateUrl: null,
        },
        include: {
            student: {
                include: {
                    faculty: true,
                },
            },
            event: {
                include: {
                    campaign: true,
                },
            },
        },
    })
}

export const createParticipant = async (eventId: number, studentId: string) => {
    return prismaClient.participant.create({
        data: {
            eventId,
            studentId,
            status: ParticipantStatus.PENDING,
        },
    })
}

export const updateParticipantStatus = async (
    id: string,
    status: ParticipantStatus
) => {
    return prismaClient.participant.update({
        where: { id },
        data: { status },
    })
}

export const updateParticipantCheckIn = async (id: string) => {
    return prismaClient.participant.update({
        where: { id },
        data: { isCheckedIn: true },
    })
}

export const updateParticipantCertificate = async (
    id: string,
    certificateUrl: string
) => {
    return prismaClient.participant.update({
        where: { id },
        data: { certificateUrl },
    })
}

export const deleteParticipant = async (id: string) => {
    return prismaClient.participant.delete({
        where: { id },
    })
}

export const addPointsToStudent = async (studentId: string, points: number) => {
    return prismaClient.student.update({
        where: { id: studentId },
        data: {
            totalPoints: {
                increment: points,
            },
        },
    })
}
