import { NextFunction } from 'express'
import * as notificationController from '../notification.controller'
import * as notificationService from '../notification.service'

jest.mock('src/config', () => ({
    prismaClient: {},
    config: {
        node_env: 'test',
    },
}))

jest.mock('../notification.service')

describe('Notification Controller', () => {
    let req: any
    let res: any
    let next: NextFunction

    beforeEach(() => {
        req = {
            params: {},
            query: {},
            payload: {},
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('getMyNotifications', () => {
        it('should return current recipient notifications', async () => {
            req.payload = { userId: 'student-1', role: 'SINHVIEN' }
            req.query = { page: '1', limit: '10' }
            ;(notificationService.getMyNotifications as jest.Mock).mockResolvedValue(
                {
                    items: [{ id: 'n-1' }],
                    meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
                }
            )

            await notificationController.getMyNotifications(req, res, next)

            expect(notificationService.getMyNotifications).toHaveBeenCalledWith(
                { studentId: 'student-1' },
                { page: 1, limit: 10 }
            )
            expect(res.json).toHaveBeenCalled()
        })
    })

    describe('markAsRead', () => {
        it('should mark one notification as read', async () => {
            req.payload = { userId: 'user-1', role: 'CLB' }
            req.params = { id: 'n-1' }
            ;(notificationService.markAsRead as jest.Mock).mockResolvedValue({
                id: 'n-1',
                isRead: true,
            })

            await notificationController.markAsRead(req, res, next)

            expect(notificationService.markAsRead).toHaveBeenCalledWith(
                'n-1',
                { userId: 'user-1' }
            )
            expect(res.json).toHaveBeenCalled()
        })
    })

    describe('markAllAsRead', () => {
        it('should mark all notifications as read', async () => {
            req.payload = { userId: 'user-1', role: 'CLB' }
            ;(notificationService.markAllAsRead as jest.Mock).mockResolvedValue(
                { count: 2 }
            )

            await notificationController.markAllAsRead(req, res, next)

            expect(notificationService.markAllAsRead).toHaveBeenCalledWith({
                userId: 'user-1',
            })
            expect(res.json).toHaveBeenCalled()
        })
    })
})
