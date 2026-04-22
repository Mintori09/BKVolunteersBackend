import * as gamificationService from '../gamification.service'
import * as pointTransactionRepo from '../pointTransaction.repository'

jest.mock('src/config', () => ({
    prismaClient: {
        $transaction: jest.fn(),
        pointTransaction: {
            create: jest.fn(),
        },
        student: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        title: {
            findMany: jest.fn(),
        },
        studentTitle: {
            findMany: jest.fn(),
            createMany: jest.fn(),
        },
    },
}))

describe('Gamification Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('awardPoints', () => {
        it('should award points and update student total', async () => {
            const { prismaClient } = require('src/config')
            const mockTx = {
                pointTransaction: { create: jest.fn().mockResolvedValue({ id: 'pt-1' }) },
                student: { update: jest.fn().mockResolvedValue({ id: 'student-1' }) },
            }
            ;(prismaClient.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return callback(mockTx)
            })
            ;(prismaClient.student.findUnique as jest.Mock).mockResolvedValue({ totalPoints: 100 })
            ;(prismaClient.title.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.studentTitle.findMany as jest.Mock).mockResolvedValue([])

            const result = await gamificationService.awardPoints({
                studentId: 'student-1',
                points: 10,
                reason: 'Event participation',
                sourceType: 'EVENT_PARTICIPATION',
                sourceId: 'event-1',
                awardedBy: 'user-1',
            })

            expect(mockTx.pointTransaction.create).toHaveBeenCalledWith({
                data: {
                    studentId: 'student-1',
                    points: 10,
                    reason: 'Event participation',
                    sourceType: 'EVENT_PARTICIPATION',
                    sourceId: 'event-1',
                    awardedBy: 'user-1',
                },
            })
            expect(mockTx.student.update).toHaveBeenCalledWith({
                where: { id: 'student-1' },
                data: { totalPoints: { increment: 10 } },
            })
            expect(result).toEqual([])
        })

        it('should award points without optional fields', async () => {
            const { prismaClient } = require('src/config')
            const mockTx = {
                pointTransaction: { create: jest.fn().mockResolvedValue({ id: 'pt-1' }) },
                student: { update: jest.fn().mockResolvedValue({ id: 'student-1' }) },
            }
            ;(prismaClient.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return callback(mockTx)
            })
            ;(prismaClient.student.findUnique as jest.Mock).mockResolvedValue({ totalPoints: 100 })
            ;(prismaClient.title.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.studentTitle.findMany as jest.Mock).mockResolvedValue([])

            await gamificationService.awardPoints({
                studentId: 'student-1',
                points: 5,
                reason: 'Bonus points',
                sourceType: 'BONUS',
            })

            expect(mockTx.pointTransaction.create).toHaveBeenCalledWith({
                data: {
                    studentId: 'student-1',
                    points: 5,
                    reason: 'Bonus points',
                    sourceType: 'BONUS',
                    sourceId: undefined,
                    awardedBy: undefined,
                },
            })
        })

        it('should unlock new titles when points qualify', async () => {
            const { prismaClient } = require('src/config')
            const mockTx = {
                pointTransaction: { create: jest.fn().mockResolvedValue({ id: 'pt-1' }) },
                student: { update: jest.fn().mockResolvedValue({ id: 'student-1' }) },
            }
            ;(prismaClient.$transaction as jest.Mock).mockImplementation(async (callback) => {
                return callback(mockTx)
            })
            ;(prismaClient.student.findUnique as jest.Mock).mockResolvedValue({ totalPoints: 110 })
            ;(prismaClient.title.findMany as jest.Mock).mockResolvedValue([
                { id: 'title-1', name: 'Bronze', minPoints: 100, isActive: true },
                { id: 'title-2', name: 'Silver', minPoints: 110, isActive: true },
            ])
            ;(prismaClient.studentTitle.findMany as jest.Mock).mockResolvedValue([
                { titleId: 'title-1' },
            ])
            ;(prismaClient.studentTitle.createMany as jest.Mock).mockResolvedValue({ count: 1 })

            const result = await gamificationService.awardPoints({
                studentId: 'student-1',
                points: 10,
                reason: 'Donation',
                sourceType: 'MONEY_DONATION',
            })

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('title-2')
            expect(prismaClient.studentTitle.createMany).toHaveBeenCalledWith({
                data: [{ studentId: 'student-1', titleId: 'title-2' }],
                skipDuplicates: true,
            })
        })
    })

    describe('checkAndUnlockTitles', () => {
        it('should return empty array if student not found', async () => {
            const { prismaClient } = require('src/config')
            ;(prismaClient.student.findUnique as jest.Mock).mockResolvedValue(null)

            const result = await gamificationService.checkAndUnlockTitles('nonexistent')

            expect(result).toEqual([])
            expect(prismaClient.title.findMany).not.toHaveBeenCalled()
        })

        it('should return empty array when no new titles to unlock', async () => {
            const { prismaClient } = require('src/config')
            ;(prismaClient.student.findUnique as jest.Mock).mockResolvedValue({ totalPoints: 50 })
            ;(prismaClient.title.findMany as jest.Mock).mockResolvedValue([
                { id: 'title-1', name: 'Bronze', minPoints: 100 },
            ])

            const result = await gamificationService.checkAndUnlockTitles('student-1')

            expect(result).toEqual([])
            expect(prismaClient.studentTitle.createMany).not.toHaveBeenCalled()
        })

        it('should return all qualified titles when student has no current titles', async () => {
            const { prismaClient } = require('src/config')
            ;(prismaClient.student.findUnique as jest.Mock).mockResolvedValue({ totalPoints: 150 })
            ;(prismaClient.title.findMany as jest.Mock).mockResolvedValue([
                { id: 'title-1', name: 'Bronze', minPoints: 50, isActive: true },
                { id: 'title-2', name: 'Silver', minPoints: 100, isActive: true },
            ])
            ;(prismaClient.studentTitle.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.studentTitle.createMany as jest.Mock).mockResolvedValue({ count: 2 })

            const result = await gamificationService.checkAndUnlockTitles('student-1')

            expect(result).toHaveLength(2)
            expect(result.map((t: any) => t.id)).toEqual(['title-1', 'title-2'])
        })

        it('should only return new titles not already unlocked', async () => {
            const { prismaClient } = require('src/config')
            ;(prismaClient.student.findUnique as jest.Mock).mockResolvedValue({ totalPoints: 150 })
            ;(prismaClient.title.findMany as jest.Mock).mockResolvedValue([
                { id: 'title-1', name: 'Bronze', minPoints: 50, isActive: true },
                { id: 'title-2', name: 'Silver', minPoints: 100, isActive: true },
            ])
            ;(prismaClient.studentTitle.findMany as jest.Mock).mockResolvedValue([
                { titleId: 'title-1' },
            ])
            ;(prismaClient.studentTitle.createMany as jest.Mock).mockResolvedValue({ count: 1 })

            const result = await gamificationService.checkAndUnlockTitles('student-1')

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('title-2')
        })

        it('should only consider active titles', async () => {
            const { prismaClient } = require('src/config')
            ;(prismaClient.student.findUnique as jest.Mock).mockResolvedValue({ totalPoints: 150 })
            ;(prismaClient.title.findMany as jest.Mock).mockResolvedValue([
                { id: 'title-1', name: 'Bronze', minPoints: 50, isActive: true },
            ])
            ;(prismaClient.studentTitle.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.studentTitle.createMany as jest.Mock).mockResolvedValue({ count: 1 })

            const result = await gamificationService.checkAndUnlockTitles('student-1')

            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('title-1')
        })

        it('should not call createMany when no new titles', async () => {
            const { prismaClient } = require('src/config')
            ;(prismaClient.student.findUnique as jest.Mock).mockResolvedValue({ totalPoints: 50 })
            ;(prismaClient.title.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.studentTitle.findMany as jest.Mock).mockResolvedValue([])

            await gamificationService.checkAndUnlockTitles('student-1')

            expect(prismaClient.studentTitle.createMany).not.toHaveBeenCalled()
        })
    })
})