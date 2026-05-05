import { ParticipantStatus } from '@prisma/client'
import { prismaClient } from 'src/config'
import * as eventRepository from '../event.repository'

jest.mock('src/config', () => ({
    prismaClient: {
        eventCampaign: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        participant: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        student: {
            update: jest.fn(),
        },
    },
}))

describe('Event Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('findEventById', () => {
        it('should find event by id with includes', async () => {
            const mockEvent = { id: 1, location: 'Hall A' }
            ;(prismaClient.eventCampaign.findUnique as jest.Mock).mockResolvedValue(mockEvent)

            const result = await eventRepository.findEventById(1)

            expect(prismaClient.eventCampaign.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                include: expect.any(Object),
            })
            expect(result).toEqual(mockEvent)
        })

        it('should return null when event not found', async () => {
            ;(prismaClient.eventCampaign.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await eventRepository.findEventById(999)
            expect(result).toBeNull()
        })
    })

    describe('findEventByCampaignId', () => {
        it('should find event by campaign id', async () => {
            const mockEvent = { id: 1, campaignId: 'camp-1' }
            ;(prismaClient.eventCampaign.findUnique as jest.Mock).mockResolvedValue(mockEvent)

            const result = await eventRepository.findEventByCampaignId('camp-1')

            expect(prismaClient.eventCampaign.findUnique).toHaveBeenCalledWith({
                where: { campaignId: 'camp-1' },
                include: expect.any(Object),
            })
            expect(result).toEqual(mockEvent)
        })

        it('should return null when event not found', async () => {
            ;(prismaClient.eventCampaign.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await eventRepository.findEventByCampaignId('nonexistent')
            expect(result).toBeNull()
        })
    })

    describe('findEventsByCampaignId', () => {
        it('should return events ordered by eventStart', async () => {
            const mockEvents = [{ id: 1 }, { id: 2 }]
            ;(prismaClient.eventCampaign.findMany as jest.Mock).mockResolvedValue(mockEvents)

            const result = await eventRepository.findEventsByCampaignId('camp-1')

            expect(prismaClient.eventCampaign.findMany).toHaveBeenCalledWith({
                where: { campaignId: 'camp-1' },
                include: { _count: { select: { participants: true } } },
                orderBy: { eventStart: 'asc' },
            })
            expect(result).toEqual(mockEvents)
        })
    })

    describe('createEvent', () => {
        it('should create an event', async () => {
            const mockEvent = { id: 1, campaignId: 'camp-1', location: 'Hall' }
            const input = {
                location: 'Hall',
                maxParticipants: 50,
                registrationStart: new Date(),
                registrationEnd: new Date(),
                eventStart: new Date(),
                eventEnd: new Date(),
            }
            ;(prismaClient.eventCampaign.create as jest.Mock).mockResolvedValue(mockEvent)

            const result = await eventRepository.createEvent('camp-1', input)

            expect(prismaClient.eventCampaign.create).toHaveBeenCalledWith({
                data: {
                    campaignId: 'camp-1',
                    location: input.location,
                    maxParticipants: input.maxParticipants,
                    registrationStart: input.registrationStart,
                    registrationEnd: input.registrationEnd,
                    eventStart: input.eventStart,
                    eventEnd: input.eventEnd,
                },
            })
            expect(result).toEqual(mockEvent)
        })
    })

    describe('updateEvent', () => {
        it('should update an event', async () => {
            const mockEvent = { id: 1, location: 'New Hall' }
            ;(prismaClient.eventCampaign.update as jest.Mock).mockResolvedValue(mockEvent)

            const result = await eventRepository.updateEvent(1, { location: 'New Hall' })

            expect(prismaClient.eventCampaign.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { location: 'New Hall' },
            })
            expect(result).toEqual(mockEvent)
        })
    })

    describe('deleteEvent', () => {
        it('should delete an event', async () => {
            const mockEvent = { id: 1 }
            ;(prismaClient.eventCampaign.delete as jest.Mock).mockResolvedValue(mockEvent)

            const result = await eventRepository.deleteEvent(1)

            expect(prismaClient.eventCampaign.delete).toHaveBeenCalledWith({ where: { id: 1 } })
            expect(result).toEqual(mockEvent)
        })
    })

    describe('findParticipantById', () => {
        it('should find participant by id with includes', async () => {
            const mockParticipant = { id: 'p-1', status: 'PENDING' }
            ;(prismaClient.participant.findUnique as jest.Mock).mockResolvedValue(mockParticipant)

            const result = await eventRepository.findParticipantById('p-1')

            expect(prismaClient.participant.findUnique).toHaveBeenCalledWith({
                where: { id: 'p-1' },
                include: expect.any(Object),
            })
            expect(result).toEqual(mockParticipant)
        })

        it('should return null when participant not found', async () => {
            ;(prismaClient.participant.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await eventRepository.findParticipantById('nonexistent')
            expect(result).toBeNull()
        })
    })

    describe('findParticipantByEventAndStudent', () => {
        it('should find participant by event and student', async () => {
            const mockParticipant = { id: 'p-1', eventId: 1, studentId: 's-1' }
            ;(prismaClient.participant.findUnique as jest.Mock).mockResolvedValue(mockParticipant)

            const result = await eventRepository.findParticipantByEventAndStudent(1, 's-1')

            expect(prismaClient.participant.findUnique).toHaveBeenCalledWith({
                where: { eventId_studentId: { eventId: 1, studentId: 's-1' } },
            })
            expect(result).toEqual(mockParticipant)
        })
    })

    describe('countParticipantsByEvent', () => {
        it('should count all participants when no statuses filter', async () => {
            ;(prismaClient.participant.count as jest.Mock).mockResolvedValue(10)

            const result = await eventRepository.countParticipantsByEvent(1)

            expect(prismaClient.participant.count).toHaveBeenCalledWith({
                where: { eventId: 1 },
            })
            expect(result).toBe(10)
        })

        it('should count participants with status filter', async () => {
            ;(prismaClient.participant.count as jest.Mock).mockResolvedValue(5)

            const result = await eventRepository.countParticipantsByEvent(1, [
                ParticipantStatus.PENDING,
                ParticipantStatus.APPROVED,
            ])

            expect(prismaClient.participant.count).toHaveBeenCalledWith({
                where: { eventId: 1, status: { in: [ParticipantStatus.PENDING, ParticipantStatus.APPROVED] } },
            })
            expect(result).toBe(5)
        })
    })

    describe('findParticipantsByEvent', () => {
        it('should return paginated participants with default pagination', async () => {
            const mockParticipants = [{ id: 'p-1' }]
            ;(prismaClient.participant.findMany as jest.Mock).mockResolvedValue(mockParticipants)
            ;(prismaClient.participant.count as jest.Mock).mockResolvedValue(1)

            const result = await eventRepository.findParticipantsByEvent(1, {})

            expect(result.data).toEqual(mockParticipants)
            expect(result.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 })
        })

        it('should filter by status', async () => {
            ;(prismaClient.participant.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.participant.count as jest.Mock).mockResolvedValue(0)

            await eventRepository.findParticipantsByEvent(1, { status: ParticipantStatus.APPROVED })

            expect(prismaClient.participant.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ status: ParticipantStatus.APPROVED }),
                })
            )
        })

        it('should filter by isCheckedIn', async () => {
            ;(prismaClient.participant.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.participant.count as jest.Mock).mockResolvedValue(0)

            await eventRepository.findParticipantsByEvent(1, { isCheckedIn: true })

            expect(prismaClient.participant.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ isCheckedIn: true }),
                })
            )
        })

        it('should use custom pagination', async () => {
            ;(prismaClient.participant.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.participant.count as jest.Mock).mockResolvedValue(25)

            const result = await eventRepository.findParticipantsByEvent(1, { page: 2, limit: 10 })

            expect(result.meta).toEqual({ total: 25, page: 2, limit: 10, totalPages: 3 })
        })
    })

    describe('findParticipantsByStudent', () => {
        it('should return paginated participants for student', async () => {
            const mockParticipants = [{ id: 'p-1' }]
            ;(prismaClient.participant.findMany as jest.Mock).mockResolvedValue(mockParticipants)
            ;(prismaClient.participant.count as jest.Mock).mockResolvedValue(1)

            const result = await eventRepository.findParticipantsByStudent('s-1', {})

            expect(result.data).toEqual(mockParticipants)
            expect(result.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 })
        })

        it('should filter by status', async () => {
            ;(prismaClient.participant.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.participant.count as jest.Mock).mockResolvedValue(0)

            await eventRepository.findParticipantsByStudent('s-1', { status: ParticipantStatus.APPROVED })

            expect(prismaClient.participant.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ status: ParticipantStatus.APPROVED }),
                })
            )
        })
    })

    describe('findParticipantsForBulkCertificate', () => {
        it('should find participants that are checked in without certificate', async () => {
            const mockParticipants = [{ id: 'p-1' }]
            ;(prismaClient.participant.findMany as jest.Mock).mockResolvedValue(mockParticipants)

            const result = await eventRepository.findParticipantsForBulkCertificate(1)

            expect(prismaClient.participant.findMany).toHaveBeenCalledWith({
                where: { eventId: 1, isCheckedIn: true, certificateUrl: null },
                include: expect.any(Object),
            })
            expect(result).toEqual(mockParticipants)
        })
    })

    describe('createParticipant', () => {
        it('should create a participant with PENDING status', async () => {
            const mockParticipant = { id: 'p-1', eventId: 1, studentId: 's-1', status: ParticipantStatus.PENDING }
            ;(prismaClient.participant.create as jest.Mock).mockResolvedValue(mockParticipant)

            const result = await eventRepository.createParticipant(1, 's-1')

            expect(prismaClient.participant.create).toHaveBeenCalledWith({
                data: { eventId: 1, studentId: 's-1', status: ParticipantStatus.PENDING },
            })
            expect(result).toEqual(mockParticipant)
        })
    })

    describe('updateParticipantStatus', () => {
        it('should update participant status', async () => {
            const mockParticipant = { id: 'p-1', status: ParticipantStatus.APPROVED }
            ;(prismaClient.participant.update as jest.Mock).mockResolvedValue(mockParticipant)

            const result = await eventRepository.updateParticipantStatus('p-1', ParticipantStatus.APPROVED)

            expect(prismaClient.participant.update).toHaveBeenCalledWith({
                where: { id: 'p-1' },
                data: { status: ParticipantStatus.APPROVED },
            })
            expect(result).toEqual(mockParticipant)
        })
    })

    describe('updateParticipantCheckIn', () => {
        it('should update participant check in status', async () => {
            const mockParticipant = { id: 'p-1', isCheckedIn: true }
            ;(prismaClient.participant.update as jest.Mock).mockResolvedValue(mockParticipant)

            const result = await eventRepository.updateParticipantCheckIn('p-1')

            expect(prismaClient.participant.update).toHaveBeenCalledWith({
                where: { id: 'p-1' },
                data: { isCheckedIn: true },
            })
            expect(result).toEqual(mockParticipant)
        })
    })

    describe('updateParticipantCertificate', () => {
        it('should update participant certificate url', async () => {
            const mockParticipant = { id: 'p-1', certificateUrl: 'https://example.com/cert' }
            ;(prismaClient.participant.update as jest.Mock).mockResolvedValue(mockParticipant)

            const result = await eventRepository.updateParticipantCertificate('p-1', 'https://example.com/cert')

            expect(prismaClient.participant.update).toHaveBeenCalledWith({
                where: { id: 'p-1' },
                data: { certificateUrl: 'https://example.com/cert' },
            })
            expect(result).toEqual(mockParticipant)
        })
    })

    describe('deleteParticipant', () => {
        it('should delete a participant', async () => {
            const mockParticipant = { id: 'p-1' }
            ;(prismaClient.participant.delete as jest.Mock).mockResolvedValue(mockParticipant)

            const result = await eventRepository.deleteParticipant('p-1')

            expect(prismaClient.participant.delete).toHaveBeenCalledWith({ where: { id: 'p-1' } })
            expect(result).toEqual(mockParticipant)
        })
    })

    describe('addPointsToStudent', () => {
        it('should increment student points', async () => {
            const mockStudent = { id: 's-1', totalPoints: 100 }
            ;(prismaClient.student.update as jest.Mock).mockResolvedValue(mockStudent)

            const result = await eventRepository.addPointsToStudent('s-1', 10)

            expect(prismaClient.student.update).toHaveBeenCalledWith({
                where: { id: 's-1' },
                data: { totalPoints: { increment: 10 } },
            })
            expect(result).toEqual(mockStudent)
        })
    })
})