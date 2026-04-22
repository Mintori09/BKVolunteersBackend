import { Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiResponse } from 'src/utils/ApiResponse'
import { TypedRequest } from 'src/types/request'
import * as eventService from './event.service'
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

export const createEvent = catchAsync(
    async (req: TypedRequest<CreateEventInput>, res: Response) => {
        const userId = req.payload!.userId
        const { campaignId } = req.params as { campaignId: string }
        const data = req.body as CreateEventInput

        const event = await eventService.createEvent(campaignId, userId, data)

        return ApiResponse.success(
            res,
            event,
            'Tạo sự kiện thành công',
            HttpStatus.CREATED
        )
    }
)

export const updateEvent = catchAsync(
    async (req: TypedRequest<UpdateEventInput>, res: Response) => {
        const userId = req.payload!.userId
        const { campaignId, eventId } = req.params as {
            campaignId: string
            eventId: string
        }
        const data = req.body as UpdateEventInput

        const event = await eventService.updateEvent(
            campaignId,
            parseInt(eventId, 10),
            userId,
            data
        )

        return ApiResponse.success(res, event, 'Cập nhật sự kiện thành công')
    }
)

export const deleteEvent = catchAsync(
    async (req: TypedRequest, res: Response) => {
        const userId = req.payload!.userId
        const { campaignId, eventId } = req.params as {
            campaignId: string
            eventId: string
        }

        await eventService.deleteEvent(
            campaignId,
            parseInt(eventId, 10),
            userId
        )

        return res.sendStatus(HttpStatus.NO_CONTENT)
    }
)

export const getEventsByCampaign = catchAsync(
    async (req: TypedRequest, res: Response) => {
        const { campaignId } = req.params as { campaignId: string }

        const events = await eventService.getEventsByCampaign(campaignId)

        return ApiResponse.success(res, events)
    }
)

export const getEventById = catchAsync(
    async (req: TypedRequest, res: Response) => {
        const { eventId } = req.params as { eventId: string }

        const event = await eventService.getEventById(parseInt(eventId, 10))

        return ApiResponse.success(res, event)
    }
)

export const registerForEvent = catchAsync(
    async (req: TypedRequest, res: Response) => {
        const studentId = req.payload!.userId
        const studentFacultyId = (req.payload as any).facultyId ?? null
        const { eventId } = req.params as { eventId: string }

        const participant = await eventService.registerForEvent(
            parseInt(eventId, 10),
            studentId,
            studentFacultyId
        )

        return ApiResponse.success(
            res,
            participant,
            'Đăng ký thành công',
            HttpStatus.CREATED
        )
    }
)

export const cancelRegistration = catchAsync(
    async (req: TypedRequest, res: Response) => {
        const studentId = req.payload!.userId
        const { eventId } = req.params as { eventId: string }

        await eventService.cancelRegistration(parseInt(eventId, 10), studentId)

        return res.sendStatus(HttpStatus.NO_CONTENT)
    }
)

export const getMyParticipants = catchAsync(
    async (req: TypedRequest<any, GetMyParticipantsQuery>, res: Response) => {
        const studentId = req.payload!.userId
        const query = req.query as GetMyParticipantsQuery

        const result = await eventService.getMyParticipants(studentId, query)

        return res.status(HttpStatus.OK).json({
            success: true,
            message: 'Success',
            data: result.data,
            meta: result.meta,
        })
    }
)

export const getParticipantsByEvent = catchAsync(
    async (req: TypedRequest<any, GetParticipantsQuery>, res: Response) => {
        const userId = req.payload!.userId
        const role = req.payload!.role
        const { eventId } = req.params as { eventId: string }
        const query = req.query as GetParticipantsQuery

        const result = await eventService.getParticipantsByEvent(
            parseInt(eventId, 10),
            userId,
            role,
            query
        )

        return res.status(HttpStatus.OK).json({
            success: true,
            message: 'Success',
            data: result.data,
            meta: result.meta,
        })
    }
)

export const approveParticipant = catchAsync(
    async (req: TypedRequest<ApproveParticipantInput>, res: Response) => {
        const userId = req.payload!.userId
        const { id } = req.params as { id: string }
        const data = req.body as ApproveParticipantInput

        const participant = await eventService.approveParticipant(
            id,
            userId,
            data
        )

        return ApiResponse.success(res, participant, 'Phê duyệt thành công')
    }
)

export const rejectParticipant = catchAsync(
    async (req: TypedRequest<RejectParticipantInput>, res: Response) => {
        const userId = req.payload!.userId
        const { id } = req.params as { id: string }
        const data = req.body as RejectParticipantInput

        const participant = await eventService.rejectParticipant(
            id,
            userId,
            data
        )

        return ApiResponse.success(res, participant, 'Từ chối thành công')
    }
)

export const checkInParticipant = catchAsync(
    async (req: TypedRequest, res: Response) => {
        const userId = req.payload!.userId
        const { id } = req.params as { id: string }

        const participant = await eventService.checkInParticipant(id, userId)

        return ApiResponse.success(res, participant, 'Check-in thành công')
    }
)

export const sendCertificate = catchAsync(
    async (req: TypedRequest<SendCertificateInput>, res: Response) => {
        const userId = req.payload!.userId
        const { id } = req.params as { id: string }
        const data = req.body as SendCertificateInput

        const result = await eventService.sendCertificateToParticipant(
            id,
            userId,
            data
        )

        return ApiResponse.success(res, result, 'Gửi chứng nhận thành công')
    }
)

export const sendBulkCertificates = catchAsync(
    async (req: TypedRequest<BulkCertificateInput>, res: Response) => {
        const userId = req.payload!.userId
        const { eventId } = req.params as { eventId: string }
        const data = req.body as BulkCertificateInput

        const result = await eventService.sendBulkCertificates(
            parseInt(eventId, 10),
            userId,
            data
        )

        const message =
            result.failedCount > 0
                ? `Đã gửi ${result.successCount} chứng nhận thành công, ${result.failedCount} thất bại`
                : `Đã gửi ${result.successCount} chứng nhận thành công`

        return ApiResponse.success(res, result, message)
    }
)
