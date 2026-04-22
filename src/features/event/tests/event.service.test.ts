import { ParticipantStatus, CampaignStatus, CampaignScope } from '@prisma/client'
import * as eventRepository from '../event.repository'
import * as eventService from '../event.service'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'

jest.mock('../event.repository')
jest.mock('src/config/nodemailer', () => ({
    __esModule: true,
    default: {
        sendMail: jest.fn(),
    },
}))
jest.mock('src/config', () => ({
    prismaClient: {},
    config: {
        cors: { cors_origin: ['http://localhost:3000'] },
        email: { from: 'test@example.com' },
        server: { url: 'http://localhost:3000' },
    },
}))

describe('Event Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('createEvent', () => {
        const validInput = {
            location: 'Hall',
            maxParticipants: 50,
            registrationStart: new Date('2025-01-01'),
            registrationEnd: new Date('2025-01-31'),
            eventStart: new Date('2025-02-01'),
            eventEnd: new Date('2025-02-28'),
        }

        it('should throw NOT_FOUND if campaign not found', async () => {
            ;(eventRepository.findEventByCampaignId as jest.Mock).mockResolvedValue(null)

            await expect(
                eventService.createEvent('camp-1', 'user-1', validInput)
            ).rejects.toThrow(ApiError)
            await expect(
                eventService.createEvent('camp-1', 'user-1', validInput)
            ).rejects.toHaveProperty('statusCode', HttpStatus.NOT_FOUND)
        })

        it('should throw FORBIDDEN if user is not campaign creator', async () => {
            ;(eventRepository.findEventByCampaignId as jest.Mock).mockResolvedValue({
                id: 1,
                campaign: { creatorId: 'other-user', status: CampaignStatus.ACTIVE },
            })

            await expect(
                eventService.createEvent('camp-1', 'user-1', validInput)
            ).rejects.toThrow(ApiError)
            await expect(
                eventService.createEvent('camp-1', 'user-1', validInput)
            ).rejects.toHaveProperty('statusCode', HttpStatus.FORBIDDEN)
        })

        it('should throw BAD_REQUEST if campaign status is not DRAFT or ACTIVE', async () => {
            ;(eventRepository.findEventByCampaignId as jest.Mock).mockResolvedValue({
                id: 1,
                campaign: { creatorId: 'user-1', status: CampaignStatus.COMPLETED },
            })

            await expect(
                eventService.createEvent('camp-1', 'user-1', validInput)
            ).rejects.toThrow(ApiError)
            await expect(
                eventService.createEvent('camp-1', 'user-1', validInput)
            ).rejects.toHaveProperty('statusCode', HttpStatus.BAD_REQUEST)
        })

        it('should throw CONFLICT if event already exists', async () => {
            ;(eventRepository.findEventByCampaignId as jest.Mock).mockResolvedValue({
                id: 1,
                campaign: { creatorId: 'user-1', status: CampaignStatus.DRAFT },
            })

            await expect(
                eventService.createEvent('camp-1', 'user-1', validInput)
            ).rejects.toThrow(ApiError)
            await expect(
                eventService.createEvent('camp-1', 'user-1', validInput)
            ).rejects.toHaveProperty('statusCode', HttpStatus.CONFLICT)
        })
    })

    describe('updateEvent', () => {
        it('should throw NOT_FOUND if event not found', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue(null)

            await expect(
                eventService.updateEvent('camp-1', 1, 'user-1', { location: 'Hall' })
            ).rejects.toThrow(ApiError)
        })

        it('should throw BAD_REQUEST if event does not belong to campaign', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                campaignId: 'other-camp',
                campaign: { creatorId: 'user-1', status: CampaignStatus.ACTIVE },
            })

            await expect(
                eventService.updateEvent('camp-1', 1, 'user-1', { location: 'Hall' })
            ).rejects.toThrow(ApiError)
            await expect(
                eventService.updateEvent('camp-1', 1, 'user-1', { location: 'Hall' })
            ).rejects.toHaveProperty('statusCode', HttpStatus.BAD_REQUEST)
        })

        it('should throw FORBIDDEN if user is not campaign creator', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                campaignId: 'camp-1',
                campaign: { creatorId: 'other-user', status: CampaignStatus.ACTIVE },
            })

            await expect(
                eventService.updateEvent('camp-1', 1, 'user-1', { location: 'Hall' })
            ).rejects.toThrow(ApiError)
            await expect(
                eventService.updateEvent('camp-1', 1, 'user-1', { location: 'Hall' })
            ).rejects.toHaveProperty('statusCode', HttpStatus.FORBIDDEN)
        })

        it('should throw BAD_REQUEST if campaign is COMPLETED or CANCELLED', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                campaignId: 'camp-1',
                campaign: { creatorId: 'user-1', status: CampaignStatus.COMPLETED },
            })

            await expect(
                eventService.updateEvent('camp-1', 1, 'user-1', { location: 'Hall' })
            ).rejects.toThrow(ApiError)
            await expect(
                eventService.updateEvent('camp-1', 1, 'user-1', { location: 'Hall' })
            ).rejects.toHaveProperty('statusCode', HttpStatus.BAD_REQUEST)
        })

        it('should throw BAD_REQUEST if maxParticipants less than approved count', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                campaignId: 'camp-1',
                campaign: { creatorId: 'user-1', status: CampaignStatus.ACTIVE },
            })
            ;(eventRepository.countParticipantsByEvent as jest.Mock).mockResolvedValue(10)

            await expect(
                eventService.updateEvent('camp-1', 1, 'user-1', { maxParticipants: 5 })
            ).rejects.toThrow(ApiError)
            await expect(
                eventService.updateEvent('camp-1', 1, 'user-1', { maxParticipants: 5 })
            ).rejects.toHaveProperty('statusCode', HttpStatus.BAD_REQUEST)
        })

        it('should update event successfully', async () => {
            const mockEvent = { id: 1, location: 'New Hall' }
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                campaignId: 'camp-1',
                campaign: { creatorId: 'user-1', status: CampaignStatus.ACTIVE },
            })
            ;(eventRepository.countParticipantsByEvent as jest.Mock).mockResolvedValue(5)
            ;(eventRepository.updateEvent as jest.Mock).mockResolvedValue(mockEvent)

            const result = await eventService.updateEvent('camp-1', 1, 'user-1', { maxParticipants: 10 })

            expect(result).toEqual(mockEvent)
        })
    })

    describe('deleteEvent', () => {
        it('should throw NOT_FOUND if event not found', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue(null)

            await expect(
                eventService.deleteEvent('camp-1', 1, 'user-1')
            ).rejects.toThrow(ApiError)
        })

        it('should throw BAD_REQUEST if campaign is not DRAFT', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                campaignId: 'camp-1',
                campaign: { creatorId: 'user-1', status: CampaignStatus.ACTIVE },
            })

            await expect(
                eventService.deleteEvent('camp-1', 1, 'user-1')
            ).rejects.toThrow(ApiError)
            await expect(
                eventService.deleteEvent('camp-1', 1, 'user-1')
            ).rejects.toHaveProperty('statusCode', HttpStatus.BAD_REQUEST)
        })

        it('should delete event successfully', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                campaignId: 'camp-1',
                campaign: { creatorId: 'user-1', status: CampaignStatus.DRAFT },
            })
            ;(eventRepository.deleteEvent as jest.Mock).mockResolvedValue(undefined)

            await eventService.deleteEvent('camp-1', 1, 'user-1')

            expect(eventRepository.deleteEvent).toHaveBeenCalledWith(1)
        })
    })

    describe('getEventById', () => {
        it('should throw NOT_FOUND if event not found', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue(null)

            await expect(eventService.getEventById(1)).rejects.toThrow(ApiError)
        })

        it('should return event', async () => {
            const mockEvent = { id: 1, location: 'Hall' }
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue(mockEvent)

            const result = await eventService.getEventById(1)

            expect(result).toEqual(mockEvent)
        })
    })

    describe('registerForEvent', () => {
        it('should throw NOT_FOUND if event not found', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue(null)

            await expect(
                eventService.registerForEvent(1, 'student-1', null)
            ).rejects.toThrow(ApiError)
        })

        it('should throw BAD_REQUEST if campaign is not ACTIVE', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                campaign: { status: CampaignStatus.DRAFT },
            })

            await expect(
                eventService.registerForEvent(1, 'student-1', null)
            ).rejects.toThrow(ApiError)
            await expect(
                eventService.registerForEvent(1, 'student-1', null)
            ).rejects.toHaveProperty('statusCode', HttpStatus.BAD_REQUEST)
        })

        it('should throw BAD_REQUEST if registration ended', async () => {
            const pastDate = new Date('2020-01-01')
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                registrationEnd: pastDate,
                campaign: { status: CampaignStatus.ACTIVE },
            })

            await expect(
                eventService.registerForEvent(1, 'student-1', null)
            ).rejects.toThrow(ApiError)
            await expect(
                eventService.registerForEvent(1, 'student-1', null)
            ).rejects.toHaveProperty('statusCode', HttpStatus.BAD_REQUEST)
        })

        it('should throw BAD_REQUEST if max participants reached', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                maxParticipants: 10,
                registrationEnd: new Date('2099-01-01'),
                campaign: { status: CampaignStatus.ACTIVE },
            })
            ;(eventRepository.countParticipantsByEvent as jest.Mock).mockResolvedValue(10)

            await expect(
                eventService.registerForEvent(1, 'student-1', null)
            ).rejects.toThrow(ApiError)
            await expect(
                eventService.registerForEvent(1, 'student-1', null)
            ).rejects.toHaveProperty('statusCode', HttpStatus.BAD_REQUEST)
        })

        it('should throw BAD_REQUEST if already registered', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                maxParticipants: 50,
                registrationEnd: new Date('2099-01-01'),
                campaign: { status: CampaignStatus.ACTIVE },
            })
            ;(eventRepository.countParticipantsByEvent as jest.Mock).mockResolvedValue(5)
            ;(eventRepository.findParticipantByEventAndStudent as jest.Mock).mockResolvedValue({ id: 'p-1' })

            await expect(
                eventService.registerForEvent(1, 'student-1', null)
            ).rejects.toThrow(ApiError)
            await expect(
                eventService.registerForEvent(1, 'student-1', null)
            ).rejects.toHaveProperty('statusCode', HttpStatus.BAD_REQUEST)
        })

        it('should throw FORBIDDEN if student faculty mismatch for KHOA scope', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                maxParticipants: 50,
                registrationEnd: new Date('2099-01-01'),
                campaign: {
                    status: CampaignStatus.ACTIVE,
                    scope: CampaignScope.KHOA,
                    creator: { faculty: { code: 'CS' } },
                },
            })
            ;(eventRepository.countParticipantsByEvent as jest.Mock).mockResolvedValue(5)
            ;(eventRepository.findParticipantByEventAndStudent as jest.Mock).mockResolvedValue(null)

            await expect(
                eventService.registerForEvent(1, 'student-1', 'EE')
            ).rejects.toThrow(ApiError)
            await expect(
                eventService.registerForEvent(1, 'student-1', 'EE')
            ).rejects.toHaveProperty('statusCode', HttpStatus.FORBIDDEN)
        })

        it('should register successfully', async () => {
            const mockParticipant = { id: 'p-1', status: ParticipantStatus.PENDING }
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                maxParticipants: 50,
                registrationEnd: new Date('2099-01-01'),
                campaign: { status: CampaignStatus.ACTIVE, scope: 'CONG' as any },
            })
            ;(eventRepository.countParticipantsByEvent as jest.Mock).mockResolvedValue(5)
            ;(eventRepository.findParticipantByEventAndStudent as jest.Mock).mockResolvedValue(null)
            ;(eventRepository.createParticipant as jest.Mock).mockResolvedValue(mockParticipant)

            const result = await eventService.registerForEvent(1, 'student-1', null)

            expect(result).toEqual(mockParticipant)
        })
    })

    describe('cancelRegistration', () => {
        it('should throw NOT_FOUND if participant not found', async () => {
            ;(eventRepository.findParticipantByEventAndStudent as jest.Mock).mockResolvedValue(null)

            await expect(eventService.cancelRegistration(1, 'student-1')).rejects.toThrow(ApiError)
        })

        it('should throw BAD_REQUEST if participant not PENDING', async () => {
            ;(eventRepository.findParticipantByEventAndStudent as jest.Mock).mockResolvedValue({
                id: 'p-1',
                status: ParticipantStatus.APPROVED,
            })

            await expect(eventService.cancelRegistration(1, 'student-1')).rejects.toThrow(ApiError)
            await expect(eventService.cancelRegistration(1, 'student-1')).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.BAD_REQUEST
            )
        })

        it('should cancel registration successfully', async () => {
            ;(eventRepository.findParticipantByEventAndStudent as jest.Mock).mockResolvedValue({
                id: 'p-1',
                status: ParticipantStatus.PENDING,
            })
            ;(eventRepository.deleteParticipant as jest.Mock).mockResolvedValue(undefined)

            await eventService.cancelRegistration(1, 'student-1')

            expect(eventRepository.deleteParticipant).toHaveBeenCalledWith('p-1')
        })
    })

    describe('getParticipantsByEvent', () => {
        it('should throw NOT_FOUND if event not found', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue(null)

            await expect(eventService.getParticipantsByEvent(1, 'user-1', 'CLB', {})).rejects.toThrow(
                ApiError
            )
        })

        it('should throw FORBIDDEN if user not creator or DOANTRUONG', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                campaign: { creatorId: 'other-user' },
            })

            await expect(eventService.getParticipantsByEvent(1, 'user-1', 'CLB', {})).rejects.toThrow(
                ApiError
            )
            await expect(eventService.getParticipantsByEvent(1, 'user-1', 'CLB', {})).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.FORBIDDEN
            )
        })

        it('should return participants for creator', async () => {
            const mockResult = { data: [], meta: { total: 0 } }
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                campaign: { creatorId: 'user-1' },
            })
            ;(eventRepository.findParticipantsByEvent as jest.Mock).mockResolvedValue(mockResult)

            const result = await eventService.getParticipantsByEvent(1, 'user-1', 'CLB', {})

            expect(result).toEqual(mockResult)
        })

        it('should return participants for DOANTRUONG', async () => {
            const mockResult = { data: [], meta: { total: 0 } }
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                campaign: { creatorId: 'other-user' },
            })
            ;(eventRepository.findParticipantsByEvent as jest.Mock).mockResolvedValue(mockResult)

            const result = await eventService.getParticipantsByEvent(1, 'user-1', 'DOANTRUONG', {})

            expect(result).toEqual(mockResult)
        })
    })

    describe('approveParticipant', () => {
        it('should throw NOT_FOUND if participant not found', async () => {
            ;(eventRepository.findParticipantById as jest.Mock).mockResolvedValue(null)

            await expect(eventService.approveParticipant('p-1', 'user-1', {})).rejects.toThrow(ApiError)
        })

        it('should throw FORBIDDEN if not campaign creator', async () => {
            ;(eventRepository.findParticipantById as jest.Mock).mockResolvedValue({
                id: 'p-1',
                status: ParticipantStatus.PENDING,
                event: { campaign: { creatorId: 'other-user' } },
            })

            await expect(eventService.approveParticipant('p-1', 'user-1', {})).rejects.toThrow(ApiError)
            await expect(eventService.approveParticipant('p-1', 'user-1', {})).rejects.toHaveProperty(
                'statusCode',
                HttpStatus.FORBIDDEN
            )
        })

        it('should throw BAD_REQUEST if participant not PENDING', async () => {
            ;(eventRepository.findParticipantById as jest.Mock).mockResolvedValue({
                id: 'p-1',
                status: ParticipantStatus.APPROVED,
                event: { campaign: { creatorId: 'user-1' } },
            })

            await expect(eventService.approveParticipant('p-1', 'user-1', {})).rejects.toThrow(ApiError)
        })

        it('should approve participant successfully', async () => {
            const mockParticipant = { id: 'p-1', status: ParticipantStatus.APPROVED }
            ;(eventRepository.findParticipantById as jest.Mock).mockResolvedValue({
                id: 'p-1',
                status: ParticipantStatus.PENDING,
                event: { campaign: { creatorId: 'user-1' } },
            })
            ;(eventRepository.updateParticipantStatus as jest.Mock).mockResolvedValue(mockParticipant)

            const result = await eventService.approveParticipant('p-1', 'user-1', {})

            expect(result).toEqual(mockParticipant)
        })
    })

    describe('rejectParticipant', () => {
        it('should throw NOT_FOUND if participant not found', async () => {
            ;(eventRepository.findParticipantById as jest.Mock).mockResolvedValue(null)

            await expect(eventService.rejectParticipant('p-1', 'user-1', { reason: 'test' })).rejects.toThrow(
                ApiError
            )
        })

        it('should throw FORBIDDEN if not campaign creator', async () => {
            ;(eventRepository.findParticipantById as jest.Mock).mockResolvedValue({
                id: 'p-1',
                status: ParticipantStatus.PENDING,
                event: { campaign: { creatorId: 'other-user' } },
            })

            await expect(eventService.rejectParticipant('p-1', 'user-1', { reason: 'test' })).rejects.toThrow(
                ApiError
            )
        })

        it('should throw BAD_REQUEST if participant not PENDING', async () => {
            ;(eventRepository.findParticipantById as jest.Mock).mockResolvedValue({
                id: 'p-1',
                status: ParticipantStatus.APPROVED,
                event: { campaign: { creatorId: 'user-1' } },
            })

            await expect(eventService.rejectParticipant('p-1', 'user-1', { reason: 'test' })).rejects.toThrow(
                ApiError
            )
        })

        it('should reject participant successfully', async () => {
            const mockParticipant = { id: 'p-1', status: ParticipantStatus.REJECTED }
            ;(eventRepository.findParticipantById as jest.Mock).mockResolvedValue({
                id: 'p-1',
                status: ParticipantStatus.PENDING,
                event: { campaign: { creatorId: 'user-1' } },
            })
            ;(eventRepository.updateParticipantStatus as jest.Mock).mockResolvedValue(mockParticipant)

            const result = await eventService.rejectParticipant('p-1', 'user-1', { reason: 'test' })

            expect(result).toEqual(mockParticipant)
        })
    })

    describe('checkInParticipant', () => {
        it('should throw NOT_FOUND if participant not found', async () => {
            ;(eventRepository.findParticipantById as jest.Mock).mockResolvedValue(null)

            await expect(eventService.checkInParticipant('p-1', 'user-1')).rejects.toThrow(ApiError)
        })

        it('should throw FORBIDDEN if not campaign creator', async () => {
            ;(eventRepository.findParticipantById as jest.Mock).mockResolvedValue({
                id: 'p-1',
                status: ParticipantStatus.APPROVED,
                isCheckedIn: false,
                event: { campaign: { creatorId: 'other-user' } },
            })

            await expect(eventService.checkInParticipant('p-1', 'user-1')).rejects.toThrow(ApiError)
        })

        it('should throw BAD_REQUEST if participant not APPROVED', async () => {
            ;(eventRepository.findParticipantById as jest.Mock).mockResolvedValue({
                id: 'p-1',
                status: ParticipantStatus.PENDING,
                isCheckedIn: false,
                event: { campaign: { creatorId: 'user-1' } },
            })

            await expect(eventService.checkInParticipant('p-1', 'user-1')).rejects.toThrow(ApiError)
        })

        it('should throw BAD_REQUEST if already checked in', async () => {
            ;(eventRepository.findParticipantById as jest.Mock).mockResolvedValue({
                id: 'p-1',
                status: ParticipantStatus.APPROVED,
                isCheckedIn: true,
                event: { campaign: { creatorId: 'user-1' } },
            })

            await expect(eventService.checkInParticipant('p-1', 'user-1')).rejects.toThrow(ApiError)
        })

        it('should check in participant successfully', async () => {
            const mockParticipant = { id: 'p-1', isCheckedIn: true }
            ;(eventRepository.findParticipantById as jest.Mock).mockResolvedValue({
                id: 'p-1',
                status: ParticipantStatus.APPROVED,
                isCheckedIn: false,
                event: { campaign: { creatorId: 'user-1' } },
            })
            ;(eventRepository.updateParticipantCheckIn as jest.Mock).mockResolvedValue(mockParticipant)

            const result = await eventService.checkInParticipant('p-1', 'user-1')

            expect(result).toEqual(mockParticipant)
        })
    })

    describe('sendCertificateToParticipant', () => {
        it('should throw NOT_FOUND if participant not found', async () => {
            ;(eventRepository.findParticipantById as jest.Mock).mockResolvedValue(null)

            await expect(
                eventService.sendCertificateToParticipant('p-1', 'user-1', { certificateUrl: 'url' })
            ).rejects.toThrow(ApiError)
        })

        it('should throw FORBIDDEN if not campaign creator', async () => {
            ;(eventRepository.findParticipantById as jest.Mock).mockResolvedValue({
                id: 'p-1',
                isCheckedIn: true,
                event: { campaign: { creatorId: 'other-user' } },
            })

            await expect(
                eventService.sendCertificateToParticipant('p-1', 'user-1', { certificateUrl: 'url' })
            ).rejects.toThrow(ApiError)
        })

        it('should throw BAD_REQUEST if participant not checked in', async () => {
            ;(eventRepository.findParticipantById as jest.Mock).mockResolvedValue({
                id: 'p-1',
                isCheckedIn: false,
                event: { campaign: { creatorId: 'user-1' } },
            })

            await expect(
                eventService.sendCertificateToParticipant('p-1', 'user-1', { certificateUrl: 'url' })
            ).rejects.toThrow(ApiError)
        })

        it('should send certificate successfully', async () => {
            const mockParticipant = {
                id: 'p-1',
                isCheckedIn: true,
                studentId: 'student-1',
                student: { email: 'test@example.com', fullName: 'Test' },
                event: { campaign: { title: 'Campaign', creatorId: 'user-1' } },
            }
            ;(eventRepository.findParticipantById as jest.Mock).mockResolvedValue(mockParticipant)
            ;(eventRepository.updateParticipantCertificate as jest.Mock).mockResolvedValue({})
            ;(eventRepository.addPointsToStudent as jest.Mock).mockResolvedValue({})

            const result = await eventService.sendCertificateToParticipant('p-1', 'user-1', {
                certificateUrl: 'url',
                points: 10,
            })

            expect(result.pointsAwarded).toBe(10)
            expect(eventRepository.addPointsToStudent).toHaveBeenCalledWith('student-1', 10)
        })

        it('should use default points if not provided', async () => {
            const mockParticipant = {
                id: 'p-1',
                isCheckedIn: true,
                studentId: 'student-1',
                student: { email: 'test@example.com', fullName: 'Test' },
                event: { campaign: { title: 'Campaign', creatorId: 'user-1' } },
            }
            ;(eventRepository.findParticipantById as jest.Mock).mockResolvedValue(mockParticipant)
            ;(eventRepository.updateParticipantCertificate as jest.Mock).mockResolvedValue({})
            ;(eventRepository.addPointsToStudent as jest.Mock).mockResolvedValue({})

            const result = await eventService.sendCertificateToParticipant('p-1', 'user-1', {
                certificateUrl: 'url',
            })

            expect(result.pointsAwarded).toBe(10) // DEFAULT_EVENT_POINTS
        })
    })

    describe('sendBulkCertificates', () => {
        it('should throw NOT_FOUND if event not found', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue(null)

            await expect(
                eventService.sendBulkCertificates(1, 'user-1', {})
            ).rejects.toThrow(ApiError)
        })

        it('should throw FORBIDDEN if not campaign creator', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                campaign: { creatorId: 'other-user' },
            })

            await expect(
                eventService.sendBulkCertificates(1, 'user-1', {})
            ).rejects.toThrow(ApiError)
        })

        it('should throw BAD_REQUEST if no eligible participants', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                campaign: { creatorId: 'user-1' },
            })
            ;(eventRepository.findParticipantsForBulkCertificate as jest.Mock).mockResolvedValue([])

            await expect(
                eventService.sendBulkCertificates(1, 'user-1', {})
            ).rejects.toThrow(ApiError)
            await expect(
                eventService.sendBulkCertificates(1, 'user-1', {})
            ).rejects.toHaveProperty('statusCode', HttpStatus.BAD_REQUEST)
        })

        it('should send certificates and return results', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                campaign: { creatorId: 'user-1', title: 'Campaign' },
            })
            ;(eventRepository.findParticipantsForBulkCertificate as jest.Mock).mockResolvedValue([
                { id: 'p-1', studentId: 's-1', student: { email: 'test@example.com', fullName: 'Test' } },
            ])
            ;(eventRepository.updateParticipantCertificate as jest.Mock).mockResolvedValue({})
            ;(eventRepository.addPointsToStudent as jest.Mock).mockResolvedValue({})

            const result = await eventService.sendBulkCertificates(1, 'user-1', { pointsPerParticipant: 5 })

            expect(result.successCount).toBe(1)
            expect(result.failedCount).toBe(0)
        })

        it('should handle failed participants', async () => {
            ;(eventRepository.findEventById as jest.Mock).mockResolvedValue({
                id: 1,
                campaign: { creatorId: 'user-1', title: 'Campaign' },
            })
            ;(eventRepository.findParticipantsForBulkCertificate as jest.Mock).mockResolvedValue([
                { id: 'p-1', studentId: 's-1', student: { email: 'test@example.com', fullName: 'Test' } },
            ])
            ;(eventRepository.updateParticipantCertificate as jest.Mock).mockRejectedValue(new Error('DB error'))

            const result = await eventService.sendBulkCertificates(1, 'user-1', {})

            expect(result.successCount).toBe(0)
            expect(result.failedCount).toBe(1)
            expect(result.failedParticipants).toHaveLength(1)
        })
    })
})