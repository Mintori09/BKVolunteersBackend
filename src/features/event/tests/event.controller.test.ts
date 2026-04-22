import { Response, NextFunction } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiResponse } from 'src/utils/ApiResponse'
import * as eventService from '../event.service'
import * as eventController from '../event.controller'

jest.mock('../event.service')
jest.mock('src/utils/ApiResponse')

describe('Event Controller', () => {
    let req: any
    let res: any
    let next: NextFunction

    beforeEach(() => {
        req = { body: {}, params: {}, query: {}, payload: {} }
        res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), sendStatus: jest.fn().mockReturnThis() }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('createEvent', () => {
        it('should create event successfully', async () => {
            req.params = { campaignId: 'camp-1' }
            req.payload = { userId: 'user-1' }
            req.body = { location: 'Hall A', maxParticipants: 50 }
            const mockEvent = { id: 1, campaignId: 'camp-1' }
            ;(eventService.createEvent as jest.Mock).mockResolvedValue(mockEvent)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await eventController.createEvent(req, res, next)

            expect(eventService.createEvent).toHaveBeenCalledWith('camp-1', 'user-1', req.body)
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockEvent, 'Tạo sự kiện thành công', HttpStatus.CREATED)
        })
    })

    describe('updateEvent', () => {
        it('should update event successfully', async () => {
            req.params = { campaignId: 'camp-1', eventId: '1' }
            req.payload = { userId: 'user-1' }
            req.body = { location: 'Hall B' }
            const mockEvent = { id: 1, location: 'Hall B' }
            ;(eventService.updateEvent as jest.Mock).mockResolvedValue(mockEvent)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await eventController.updateEvent(req, res, next)

            expect(eventService.updateEvent).toHaveBeenCalledWith('camp-1', 1, 'user-1', req.body)
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockEvent, 'Cập nhật sự kiện thành công')
        })
    })

    describe('deleteEvent', () => {
        it('should delete event successfully', async () => {
            req.params = { campaignId: 'camp-1', eventId: '1' }
            req.payload = { userId: 'user-1' }
            ;(eventService.deleteEvent as jest.Mock).mockResolvedValue(undefined)

            await eventController.deleteEvent(req, res, next)

            expect(eventService.deleteEvent).toHaveBeenCalledWith('camp-1', 1, 'user-1')
            expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.NO_CONTENT)
        })
    })

    describe('getEventsByCampaign', () => {
        it('should return events for campaign', async () => {
            req.params = { campaignId: 'camp-1' }
            const mockEvents = [{ id: 1 }, { id: 2 }]
            ;(eventService.getEventsByCampaign as jest.Mock).mockResolvedValue(mockEvents)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await eventController.getEventsByCampaign(req, res, next)

            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockEvents)
        })
    })

    describe('getEventById', () => {
        it('should return event by id', async () => {
            req.params = { eventId: '1' }
            const mockEvent = { id: 1, location: 'Hall A' }
            ;(eventService.getEventById as jest.Mock).mockResolvedValue(mockEvent)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await eventController.getEventById(req, res, next)

            expect(eventService.getEventById).toHaveBeenCalledWith(1)
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockEvent)
        })
    })

    describe('registerForEvent', () => {
        it('should register for event successfully', async () => {
            req.params = { eventId: '1' }
            req.payload = { userId: 'student-1', facultyId: 'CS' }
            const mockParticipant = { id: 'p-1', status: 'PENDING' }
            ;(eventService.registerForEvent as jest.Mock).mockResolvedValue(mockParticipant)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await eventController.registerForEvent(req, res, next)

            expect(eventService.registerForEvent).toHaveBeenCalledWith(1, 'student-1', 'CS')
            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockParticipant, 'Đăng ký thành công', HttpStatus.CREATED)
        })

        it('should register with null facultyId when not in payload', async () => {
            req.params = { eventId: '1' }
            req.payload = { userId: 'student-1' }
            const mockParticipant = { id: 'p-1' }
            ;(eventService.registerForEvent as jest.Mock).mockResolvedValue(mockParticipant)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await eventController.registerForEvent(req, res, next)

            expect(eventService.registerForEvent).toHaveBeenCalledWith(1, 'student-1', null)
        })
    })

    describe('cancelRegistration', () => {
        it('should cancel registration successfully', async () => {
            req.params = { eventId: '1' }
            req.payload = { userId: 'student-1' }
            ;(eventService.cancelRegistration as jest.Mock).mockResolvedValue(undefined)

            await eventController.cancelRegistration(req, res, next)

            expect(eventService.cancelRegistration).toHaveBeenCalledWith(1, 'student-1')
            expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.NO_CONTENT)
        })
    })

    describe('getMyParticipants', () => {
        it('should return my participants', async () => {
            req.payload = { userId: 'student-1' }
            req.query = { page: '1', limit: '10' }
            const mockResult = { data: [], meta: { total: 0 } }
            ;(eventService.getMyParticipants as jest.Mock).mockResolvedValue(mockResult)

            await eventController.getMyParticipants(req, res, next)

            expect(res.status).toHaveBeenCalledWith(HttpStatus.OK)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Success',
                data: mockResult.data,
                meta: mockResult.meta,
            })
        })
    })

    describe('getParticipantsByEvent', () => {
        it('should return participants by event', async () => {
            req.params = { eventId: '1' }
            req.payload = { userId: 'user-1', role: 'CLB' }
            req.query = { page: '1' }
            const mockResult = { data: [], meta: { total: 0 } }
            ;(eventService.getParticipantsByEvent as jest.Mock).mockResolvedValue(mockResult)

            await eventController.getParticipantsByEvent(req, res, next)

            expect(eventService.getParticipantsByEvent).toHaveBeenCalledWith(1, 'user-1', 'CLB', req.query)
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: true })
            )
        })
    })

    describe('approveParticipant', () => {
        it('should approve participant successfully', async () => {
            req.params = { id: 'p-1' }
            req.payload = { userId: 'user-1' }
            req.body = { comment: 'Good' }
            const mockParticipant = { id: 'p-1', status: 'APPROVED' }
            ;(eventService.approveParticipant as jest.Mock).mockResolvedValue(mockParticipant)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await eventController.approveParticipant(req, res, next)

            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockParticipant, 'Phê duyệt thành công')
        })
    })

    describe('rejectParticipant', () => {
        it('should reject participant successfully', async () => {
            req.params = { id: 'p-1' }
            req.payload = { userId: 'user-1' }
            req.body = { reason: 'Invalid' }
            const mockParticipant = { id: 'p-1', status: 'REJECTED' }
            ;(eventService.rejectParticipant as jest.Mock).mockResolvedValue(mockParticipant)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await eventController.rejectParticipant(req, res, next)

            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockParticipant, 'Từ chối thành công')
        })
    })

    describe('checkInParticipant', () => {
        it('should check in participant successfully', async () => {
            req.params = { id: 'p-1' }
            req.payload = { userId: 'user-1' }
            const mockParticipant = { id: 'p-1', isCheckedIn: true }
            ;(eventService.checkInParticipant as jest.Mock).mockResolvedValue(mockParticipant)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await eventController.checkInParticipant(req, res, next)

            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockParticipant, 'Check-in thành công')
        })
    })

    describe('sendCertificate', () => {
        it('should send certificate successfully', async () => {
            req.params = { id: 'p-1' }
            req.payload = { userId: 'user-1' }
            req.body = { certificateUrl: 'https://example.com/cert' }
            const mockResult = { id: 'p-1', certificateUrl: 'url' }
            ;(eventService.sendCertificateToParticipant as jest.Mock).mockResolvedValue(mockResult)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await eventController.sendCertificate(req, res, next)

            expect(ApiResponse.success).toHaveBeenCalledWith(res, mockResult, 'Gửi chứng nhận thành công')
        })
    })

    describe('sendBulkCertificates', () => {
        it('should send bulk certificates with no failures', async () => {
            req.params = { eventId: '1' }
            req.payload = { userId: 'user-1' }
            req.body = {}
            const mockResult = { successCount: 5, failedCount: 0, failedParticipants: [] }
            ;(eventService.sendBulkCertificates as jest.Mock).mockResolvedValue(mockResult)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await eventController.sendBulkCertificates(req, res, next)

            expect(ApiResponse.success).toHaveBeenCalledWith(
                res,
                mockResult,
                'Đã gửi 5 chứng nhận thành công'
            )
        })

        it('should send bulk certificates with some failures', async () => {
            req.params = { eventId: '1' }
            req.payload = { userId: 'user-1' }
            req.body = {}
            const mockResult = { successCount: 3, failedCount: 2, failedParticipants: [] }
            ;(eventService.sendBulkCertificates as jest.Mock).mockResolvedValue(mockResult)
            ;(ApiResponse.success as jest.Mock).mockReturnValue({})

            await eventController.sendBulkCertificates(req, res, next)

            expect(ApiResponse.success).toHaveBeenCalledWith(
                res,
                mockResult,
                'Đã gửi 3 chứng nhận thành công, 2 thất bại'
            )
        })
    })
})