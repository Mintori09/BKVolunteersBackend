import * as pointTransactionRepo from '../pointTransaction.repository'

jest.mock('src/config', () => ({
    prismaClient: {
        pointTransaction: {
            create: jest.fn(),
            findMany: jest.fn(),
            aggregate: jest.fn(),
            count: jest.fn(),
        },
    },
}))

describe('PointTransaction Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('create', () => {
        it('should create a point transaction', async () => {
            const mockTransaction = {
                id: 'pt-1',
                studentId: 'student-1',
                points: 100,
                reason: 'Test reason',
                sourceType: 'EVENT_PARTICIPATION',
                sourceId: 'event-1',
                awardedBy: 'user-1',
            }
            const { prismaClient } = require('src/config')
            ;(prismaClient.pointTransaction.create as jest.Mock).mockResolvedValue(mockTransaction)

            const result = await pointTransactionRepo.create({
                studentId: 'student-1',
                points: 100,
                reason: 'Test reason',
                sourceType: 'EVENT_PARTICIPATION',
                sourceId: 'event-1',
                awardedBy: 'user-1',
            })

            expect(result).toEqual(mockTransaction)
            expect(prismaClient.pointTransaction.create).toHaveBeenCalledWith({
                data: {
                    studentId: 'student-1',
                    points: 100,
                    reason: 'Test reason',
                    sourceType: 'EVENT_PARTICIPATION',
                    sourceId: 'event-1',
                    awardedBy: 'user-1',
                },
            })
        })

        it('should create transaction without optional fields', async () => {
            const mockTransaction = {
                id: 'pt-1',
                studentId: 'student-1',
                points: 50,
                reason: 'Bonus',
                sourceType: 'MANUAL_ADJUSTMENT',
            }
            const { prismaClient } = require('src/config')
            ;(prismaClient.pointTransaction.create as jest.Mock).mockResolvedValue(mockTransaction)

            const result = await pointTransactionRepo.create({
                studentId: 'student-1',
                points: 50,
                reason: 'Bonus',
                sourceType: 'MANUAL_ADJUSTMENT',
            })

            expect(result).toEqual(mockTransaction)
        })
    })

    describe('findManyByStudentId', () => {
        it('should return paginated transactions without filters', async () => {
            const mockTransactions = [
                { id: 'pt-1', studentId: 'student-1', points: 100 },
                { id: 'pt-2', studentId: 'student-1', points: 50 },
            ]
            const { prismaClient } = require('src/config')
            ;(prismaClient.pointTransaction.findMany as jest.Mock).mockResolvedValue(mockTransactions)
            ;(prismaClient.pointTransaction.count as jest.Mock).mockResolvedValue(2)

            const result = await pointTransactionRepo.findManyByStudentId('student-1', {}, 1, 10)

            expect(result.items).toEqual(mockTransactions)
            expect(result.meta).toEqual({ total: 2, page: 1, limit: 10, totalPages: 1 })
            expect(prismaClient.pointTransaction.findMany).toHaveBeenCalledWith({
                where: { studentId: 'student-1' },
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 10,
            })
        })

        it('should filter by sourceType', async () => {
            const mockTransactions = [{ id: 'pt-1', studentId: 'student-1', points: 100 }]
            const { prismaClient } = require('src/config')
            ;(prismaClient.pointTransaction.findMany as jest.Mock).mockResolvedValue(mockTransactions)
            ;(prismaClient.pointTransaction.count as jest.Mock).mockResolvedValue(1)

            const result = await pointTransactionRepo.findManyByStudentId('student-1', { sourceType: 'EVENT_PARTICIPATION' }, 1, 10)

            expect(result.items).toEqual(mockTransactions)
            expect(prismaClient.pointTransaction.findMany).toHaveBeenCalledWith({
                where: { studentId: 'student-1', sourceType: 'EVENT_PARTICIPATION' },
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 10,
            })
        })

        it('should filter by fromDate only', async () => {
            const fromDate = new Date('2025-01-01')
            const mockTransactions = [{ id: 'pt-1', studentId: 'student-1', points: 100 }]
            const { prismaClient } = require('src/config')
            ;(prismaClient.pointTransaction.findMany as jest.Mock).mockResolvedValue(mockTransactions)
            ;(prismaClient.pointTransaction.count as jest.Mock).mockResolvedValue(1)

            await pointTransactionRepo.findManyByStudentId('student-1', { fromDate }, 1, 10)

            expect(prismaClient.pointTransaction.findMany).toHaveBeenCalledWith({
                where: {
                    studentId: 'student-1',
                    createdAt: { gte: fromDate },
                },
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 10,
            })
        })

        it('should filter by toDate only', async () => {
            const toDate = new Date('2025-12-31')
            const mockTransactions = [{ id: 'pt-1', studentId: 'student-1', points: 100 }]
            const { prismaClient } = require('src/config')
            ;(prismaClient.pointTransaction.findMany as jest.Mock).mockResolvedValue(mockTransactions)
            ;(prismaClient.pointTransaction.count as jest.Mock).mockResolvedValue(1)

            await pointTransactionRepo.findManyByStudentId('student-1', { toDate }, 1, 10)

            expect(prismaClient.pointTransaction.findMany).toHaveBeenCalledWith({
                where: {
                    studentId: 'student-1',
                    createdAt: { lte: toDate },
                },
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 10,
            })
        })

        it('should filter by both fromDate and toDate', async () => {
            const fromDate = new Date('2025-01-01')
            const toDate = new Date('2025-12-31')
            const mockTransactions = [{ id: 'pt-1', studentId: 'student-1', points: 100 }]
            const { prismaClient } = require('src/config')
            ;(prismaClient.pointTransaction.findMany as jest.Mock).mockResolvedValue(mockTransactions)
            ;(prismaClient.pointTransaction.count as jest.Mock).mockResolvedValue(1)

            await pointTransactionRepo.findManyByStudentId('student-1', { fromDate, toDate }, 1, 10)

            expect(prismaClient.pointTransaction.findMany).toHaveBeenCalledWith({
                where: {
                    studentId: 'student-1',
                    createdAt: { gte: fromDate, lte: toDate },
                },
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 10,
            })
        })

        it('should apply pagination correctly', async () => {
            const mockTransactions = [{ id: 'pt-3', studentId: 'student-1', points: 30 }]
            const { prismaClient } = require('src/config')
            ;(prismaClient.pointTransaction.findMany as jest.Mock).mockResolvedValue(mockTransactions)
            ;(prismaClient.pointTransaction.count as jest.Mock).mockResolvedValue(25)

            const result = await pointTransactionRepo.findManyByStudentId('student-1', {}, 3, 10)

            expect(result.meta).toEqual({ total: 25, page: 3, limit: 10, totalPages: 3 })
            expect(prismaClient.pointTransaction.findMany).toHaveBeenCalledWith({
                where: { studentId: 'student-1' },
                orderBy: { createdAt: 'desc' },
                skip: 20,
                take: 10,
            })
        })

        it('should use default pagination values', async () => {
            const { prismaClient } = require('src/config')
            ;(prismaClient.pointTransaction.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.pointTransaction.count as jest.Mock).mockResolvedValue(0)

            await pointTransactionRepo.findManyByStudentId('student-1', {})

            expect(prismaClient.pointTransaction.findMany).toHaveBeenCalledWith({
                where: { studentId: 'student-1' },
                orderBy: { createdAt: 'desc' },
                skip: 0,
                take: 10,
            })
        })

        it('should combine all filters', async () => {
            const fromDate = new Date('2025-01-01')
            const toDate = new Date('2025-12-31')
            const { prismaClient } = require('src/config')
            ;(prismaClient.pointTransaction.findMany as jest.Mock).mockResolvedValue([])
            ;(prismaClient.pointTransaction.count as jest.Mock).mockResolvedValue(0)

            await pointTransactionRepo.findManyByStudentId('student-1', { sourceType: 'MONEY_DONATION', fromDate, toDate }, 2, 5)

            expect(prismaClient.pointTransaction.findMany).toHaveBeenCalledWith({
                where: {
                    studentId: 'student-1',
                    sourceType: 'MONEY_DONATION',
                    createdAt: { gte: fromDate, lte: toDate },
                },
                orderBy: { createdAt: 'desc' },
                skip: 5,
                take: 5,
            })
        })
    })

    describe('sumPointsByStudentId', () => {
        it('should return sum of points for student', async () => {
            const { prismaClient } = require('src/config')
            ;(prismaClient.pointTransaction.aggregate as jest.Mock).mockResolvedValue({
                _sum: { points: 250 },
            })

            const result = await pointTransactionRepo.sumPointsByStudentId('student-1')

            expect(result).toBe(250)
            expect(prismaClient.pointTransaction.aggregate).toHaveBeenCalledWith({
                where: { studentId: 'student-1' },
                _sum: { points: true },
            })
        })

        it('should return 0 when no transactions exist', async () => {
            const { prismaClient } = require('src/config')
            ;(prismaClient.pointTransaction.aggregate as jest.Mock).mockResolvedValue({
                _sum: { points: null },
            })

            const result = await pointTransactionRepo.sumPointsByStudentId('student-1')

            expect(result).toBe(0)
        })
    })
})