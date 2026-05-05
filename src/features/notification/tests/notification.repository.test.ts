import * as notificationRepository from '../notification.repository'
import { prismaClient } from 'src/config'

jest.mock('src/config', () => ({
    prismaClient: {
        notification: {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
    },
}))

const mockPrismaClient = prismaClient as jest.Mocked<typeof prismaClient>

describe('Notification Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('create', () => {
        it('should create a notification for a student recipient', async () => {
            const createdAt = new Date('2026-04-22T10:00:00.000Z')
            const payload = {
                title: 'Campaign approved',
                message: 'Chiến dịch đã được phê duyệt',
                type: 'CAMPAIGN_APPROVED' as const,
                recipientStudentId: 'student-1',
                relatedEntityType: 'campaign',
                relatedEntityId: 'campaign-1',
            }

            ;(mockPrismaClient.notification.create as jest.Mock).mockResolvedValue(
                {
                    id: 'notification-1',
                    ...payload,
                    recipientUserId: null,
                    isRead: false,
                    createdAt,
                    updatedAt: createdAt,
                }
            )

            const result = await notificationRepository.create(payload)

            expect(mockPrismaClient.notification.create).toHaveBeenCalledWith({
                data: payload,
            })
            expect(result.id).toBe('notification-1')
            expect(result.recipientStudentId).toBe('student-1')
        })
    })

    describe('findMine', () => {
        it('should list notifications for a student recipient with pagination', async () => {
            const createdAt = new Date('2026-04-22T10:00:00.000Z')
            ;(mockPrismaClient.notification.findMany as jest.Mock).mockResolvedValue(
                [
                    {
                        id: 'notification-1',
                        title: 'Campaign approved',
                        message: 'Chiến dịch đã được phê duyệt',
                        type: 'CAMPAIGN_APPROVED',
                        recipientStudentId: 'student-1',
                        recipientUserId: null,
                        isRead: false,
                        relatedEntityType: 'campaign',
                        relatedEntityId: 'campaign-1',
                        createdAt,
                        updatedAt: createdAt,
                    },
                ]
            )
            ;(mockPrismaClient.notification.count as jest.Mock).mockResolvedValue(
                1
            )

            const result = await notificationRepository.findMine(
                { studentId: 'student-1' },
                { page: 1, limit: 10 }
            )

            expect(mockPrismaClient.notification.findMany).toHaveBeenCalledWith({
                where: { recipientStudentId: 'student-1' },
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 10,
            })
            expect(result.items).toHaveLength(1)
            expect(result.meta).toEqual({
                total: 1,
                page: 1,
                limit: 10,
                totalPages: 1,
            })
        })
    })
})
