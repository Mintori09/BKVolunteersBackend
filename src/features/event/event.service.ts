import {
    ParticipantStatus,
    CampaignStatus,
    CampaignScope,
} from '@prisma/client'
import * as eventRepository from './event.repository'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import {
    CreateEventInput,
    UpdateEventInput,
    ApproveParticipantInput,
    RejectParticipantInput,
    SendCertificateInput,
    BulkCertificateInput,
    GetParticipantsQuery,
    GetMyParticipantsQuery,
} from './types'
import transporter from 'src/config/nodemailer'
import config from 'src/config/config'

const DEFAULT_EVENT_POINTS = 10

export const createEvent = async (
    campaignId: string,
    userId: string,
    data: CreateEventInput
) => {
    const existingEvent =
        await eventRepository.findEventByCampaignId(campaignId)

    if (!existingEvent) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy chiến dịch')
    }

    if (existingEvent.campaign.creatorId !== userId) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Bạn không có quyền tạo sự kiện cho chiến dịch này'
        )
    }

    if (
        existingEvent.campaign.status !== CampaignStatus.DRAFT &&
        existingEvent.campaign.status !== CampaignStatus.ACTIVE
    ) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Chỉ có thể tạo sự kiện cho chiến dịch ở trạng thái DRAFT hoặc ACTIVE'
        )
    }

    const eventWithSameCampaign =
        await eventRepository.findEventByCampaignId(campaignId)
    if (eventWithSameCampaign && eventWithSameCampaign.id) {
        throw new ApiError(HttpStatus.CONFLICT, 'Chiến dịch đã có sự kiện')
    }

    return eventRepository.createEvent(campaignId, data)
}

export const updateEvent = async (
    campaignId: string,
    eventId: number,
    userId: string,
    data: UpdateEventInput
) => {
    const event = await eventRepository.findEventById(eventId)

    if (!event) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện')
    }

    if (event.campaignId !== campaignId) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Sự kiện không thuộc chiến dịch này'
        )
    }

    if (event.campaign.creatorId !== userId) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Bạn không có quyền cập nhật sự kiện này'
        )
    }

    if (
        event.campaign.status === CampaignStatus.COMPLETED ||
        event.campaign.status === CampaignStatus.CANCELLED
    ) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Không thể cập nhật sự kiện của chiến dịch đã hoàn thành hoặc đã hủy'
        )
    }

    if (data.maxParticipants !== undefined) {
        const approvedCount = await eventRepository.countParticipantsByEvent(
            eventId,
            [ParticipantStatus.APPROVED]
        )
        if (data.maxParticipants < approvedCount) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                `Số lượng tối đa không thể thấp hơn ${approvedCount} người đã được phê duyệt`
            )
        }
    }

    return eventRepository.updateEvent(eventId, data)
}

export const deleteEvent = async (
    campaignId: string,
    eventId: number,
    userId: string
) => {
    const event = await eventRepository.findEventById(eventId)

    if (!event) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện')
    }

    if (event.campaignId !== campaignId) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Sự kiện không thuộc chiến dịch này'
        )
    }

    if (event.campaign.creatorId !== userId) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Bạn không có quyền xóa sự kiện này'
        )
    }

    if (event.campaign.status !== CampaignStatus.DRAFT) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Chỉ có thể xóa sự kiện khi chiến dịch ở trạng thái DRAFT'
        )
    }

    await eventRepository.deleteEvent(eventId)
}

export const getEventsByCampaign = async (campaignId: string) => {
    return eventRepository.findEventsByCampaignId(campaignId)
}

export const getEventById = async (eventId: number) => {
    const event = await eventRepository.findEventById(eventId)

    if (!event) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện')
    }

    return event
}

export const registerForEvent = async (
    eventId: number,
    studentId: string,
    studentFacultyId: string | null
) => {
    const event = await eventRepository.findEventById(eventId)

    if (!event) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện')
    }

    if (event.campaign.status !== CampaignStatus.ACTIVE) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Chiến dịch không ở trạng thái hoạt động'
        )
    }

    const now = new Date()
    if (now > event.registrationEnd) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Đã hết hạn đăng ký')
    }

    const currentCount = await eventRepository.countParticipantsByEvent(
        eventId,
        [ParticipantStatus.PENDING, ParticipantStatus.APPROVED]
    )

    if (currentCount >= event.maxParticipants) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Đã đủ số lượng tham gia')
    }

    const existingRegistration =
        await eventRepository.findParticipantByEventAndStudent(
            eventId,
            studentId
        )

    if (existingRegistration) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Bạn đã đăng ký sự kiện này')
    }

    if (event.campaign.scope === CampaignScope.KHOA) {
        const creatorFaculty = event.campaign.creator.faculty
        if (creatorFaculty && studentFacultyId !== creatorFaculty.code) {
            throw new ApiError(
                HttpStatus.FORBIDDEN,
                'Sinh viên không thuộc khoa được chỉ định'
            )
        }
    }

    const participant = await eventRepository.createParticipant(
        eventId,
        studentId
    )

    return participant
}

export const cancelRegistration = async (
    eventId: number,
    studentId: string
) => {
    const participant = await eventRepository.findParticipantByEventAndStudent(
        eventId,
        studentId
    )

    if (!participant) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy đăng ký')
    }

    if (participant.status !== ParticipantStatus.PENDING) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Không thể hủy đăng ký đã được xử lý'
        )
    }

    await eventRepository.deleteParticipant(participant.id)
}

export const getMyParticipants = async (
    studentId: string,
    query: GetMyParticipantsQuery
) => {
    return eventRepository.findParticipantsByStudent(studentId, query)
}

export const getParticipantsByEvent = async (
    eventId: number,
    userId: string,
    userRole: string,
    query: GetParticipantsQuery
) => {
    const event = await eventRepository.findEventById(eventId)

    if (!event) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện')
    }

    const isCreator = event.campaign.creatorId === userId
    const isDoanTruong = userRole === 'DOANTRUONG'

    if (!isCreator && !isDoanTruong) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Bạn không có quyền xem danh sách này'
        )
    }

    return eventRepository.findParticipantsByEvent(eventId, query)
}

export const approveParticipant = async (
    participantId: string,
    userId: string,
    _data: ApproveParticipantInput
) => {
    const participant = await eventRepository.findParticipantById(participantId)

    if (!participant) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy người đăng ký')
    }

    if (participant.event.campaign.creatorId !== userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Bạn không có quyền phê duyệt')
    }

    if (participant.status !== ParticipantStatus.PENDING) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Chỉ có thể phê duyệt người ở trạng thái PENDING'
        )
    }

    return eventRepository.updateParticipantStatus(
        participantId,
        ParticipantStatus.APPROVED
    )
}

export const rejectParticipant = async (
    participantId: string,
    userId: string,
    _data: RejectParticipantInput
) => {
    const participant = await eventRepository.findParticipantById(participantId)

    if (!participant) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy người đăng ký')
    }

    if (participant.event.campaign.creatorId !== userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Bạn không có quyền từ chối')
    }

    if (participant.status !== ParticipantStatus.PENDING) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Chỉ có thể từ chối người ở trạng thái PENDING'
        )
    }

    return eventRepository.updateParticipantStatus(
        participantId,
        ParticipantStatus.REJECTED
    )
}

export const checkInParticipant = async (
    participantId: string,
    userId: string
) => {
    const participant = await eventRepository.findParticipantById(participantId)

    if (!participant) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Không tìm thấy người tham gia'
        )
    }

    if (participant.event.campaign.creatorId !== userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'Bạn không có quyền check-in')
    }

    if (participant.status !== ParticipantStatus.APPROVED) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Chỉ có thể check-in cho người đã được phê duyệt'
        )
    }

    if (participant.isCheckedIn) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Người này đã được check-in')
    }

    return eventRepository.updateParticipantCheckIn(participantId)
}

const sendCertificateEmail = async (
    email: string,
    studentName: string,
    campaignTitle: string,
    certificateUrl: string,
    points: number
) => {
    if (!transporter) {
        console.warn('Email transporter not configured')
        return
    }

    const mailOptions = {
        from: config.email.from,
        to: email,
        subject: `Chứng nhận tham gia ${campaignTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #333; text-align: center;">Chứng nhận tham gia hoạt động tình nguyện</h2>
                <p style="color: #555; font-size: 16px; line-height: 1.5;">Xin chào <strong>${studentName}</strong>,</p>
                <p style="color: #555; font-size: 16px; line-height: 1.5;">Cảm ơn bạn đã tham gia hoạt động <strong>"${campaignTitle}"</strong>.</p>
                <p style="color: #555; font-size: 16px; line-height: 1.5;">Bạn đã được cộng <strong>${points} điểm rèn luyện</strong>.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${certificateUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Xem chứng nhận</a>
                </div>
                <p style="color: #777; font-size: 14px; text-align: center;">Trân trọng cảm ơn sự đóng góp của bạn!</p>
            </div>
        `,
    }

    try {
        await transporter.sendMail(mailOptions)
    } catch (error) {
        console.error('Failed to send certificate email:', error)
        throw error
    }
}

export const sendCertificateToParticipant = async (
    participantId: string,
    userId: string,
    data: SendCertificateInput
) => {
    const participant = await eventRepository.findParticipantById(participantId)

    if (!participant) {
        throw new ApiError(
            HttpStatus.NOT_FOUND,
            'Không tìm thấy người tham gia'
        )
    }

    if (participant.event.campaign.creatorId !== userId) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Bạn không có quyền gửi chứng nhận'
        )
    }

    if (!participant.isCheckedIn) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Người tham gia chưa được check-in'
        )
    }

    const points = data.points ?? DEFAULT_EVENT_POINTS

    await eventRepository.updateParticipantCertificate(
        participantId,
        data.certificateUrl
    )
    await eventRepository.addPointsToStudent(participant.studentId, points)

    try {
        await sendCertificateEmail(
            participant.student.email,
            participant.student.fullName,
            participant.event.campaign.title,
            data.certificateUrl,
            points
        )
    } catch (error) {
        console.error('Failed to send certificate email:', error)
    }

    return {
        ...participant,
        certificateUrl: data.certificateUrl,
        pointsAwarded: points,
    }
}

export const sendBulkCertificates = async (
    eventId: number,
    userId: string,
    data: BulkCertificateInput
) => {
    const event = await eventRepository.findEventById(eventId)

    if (!event) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sự kiện')
    }

    if (event.campaign.creatorId !== userId) {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Bạn không có quyền gửi chứng nhận'
        )
    }

    const participants =
        await eventRepository.findParticipantsForBulkCertificate(eventId)

    if (participants.length === 0) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Không có người tham gia nào đã check-in và chưa có chứng nhận'
        )
    }

    const points = data.pointsPerParticipant ?? DEFAULT_EVENT_POINTS
    const failedParticipants: Array<{ participantId: string; error: string }> =
        []
    let successCount = 0

    for (const participant of participants) {
        try {
            const certificateUrl = `${config.server.url}/certificates/${participant.id}`

            await eventRepository.updateParticipantCertificate(
                participant.id,
                certificateUrl
            )
            await eventRepository.addPointsToStudent(
                participant.studentId,
                points
            )

            await sendCertificateEmail(
                participant.student.email,
                participant.student.fullName,
                event.campaign.title,
                certificateUrl,
                points
            )

            successCount++
        } catch (error) {
            failedParticipants.push({
                participantId: participant.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            })
        }
    }

    return {
        successCount,
        failedCount: failedParticipants.length,
        failedParticipants,
    }
}
