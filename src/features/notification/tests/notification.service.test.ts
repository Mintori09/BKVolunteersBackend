import { HttpStatus } from 'src/common/constants'
import * as notificationRepository from '../notification.repository'
import * as notificationService from '../notification.service'

jest.mock('src/config', () => ({
    prismaClient: {},
    config: {
        node_env: 'test',
    },
}))

jest.mock('../notification.repository')

describe('notification.service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getMyNotifications', () => {
        it('should reject recipient without operator or student id', async () => {
            await expect(
                notificationService.getMyNotifications(
                    { accountType: 'STUDENT' },
                    { page: 1, limit: 10 }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.UNAUTHORIZED,
            })
        })

        it('should return notifications for valid student recipient', async () => {
            ;(notificationRepository.findMine as jest.Mock).mockResolvedValue({
                items: [
                    {
                        id: 1n,
                        title: 'Thong bao',
                        body: 'Noi dung',
                    },
                ],
                meta: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                },
            })

            const result = await notificationService.getMyNotifications(
                { accountType: 'STUDENT', studentId: '42' },
                { page: 1, limit: 10 }
            )

            expect(notificationRepository.findMine).toHaveBeenCalledWith(
                { accountType: 'STUDENT', studentId: '42' },
                { page: 1, limit: 10 }
            )
            expect(result).toEqual({
                items: [
                    {
                        id: 1n,
                        title: 'Thong bao',
                        body: 'Noi dung',
                    },
                ],
                meta: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                },
            })
        })
    })

    describe('markAsRead', () => {
        it('should reject missing notification', async () => {
            ;(notificationRepository.findById as jest.Mock).mockResolvedValue(null)

            await expect(
                notificationService.markAsRead('1', {
                    accountType: 'STUDENT',
                    studentId: '42',
                })
            ).rejects.toMatchObject({
                statusCode: HttpStatus.NOT_FOUND,
            })
        })

        it('should reject notification owned by another recipient', async () => {
            ;(notificationRepository.findById as jest.Mock).mockResolvedValue({
                id: 1n,
                accountType: 'STUDENT',
                studentId: 99n,
                operatorAccountId: null,
            })

            await expect(
                notificationService.markAsRead('1', {
                    accountType: 'STUDENT',
                    studentId: '42',
                })
            ).rejects.toMatchObject({
                statusCode: HttpStatus.FORBIDDEN,
            })
        })

        it('should mark notification as read for matching student recipient', async () => {
            const updated = {
                id: 1n,
                readAt: new Date('2026-05-20T16:00:00.000Z'),
            }
            ;(notificationRepository.findById as jest.Mock).mockResolvedValue({
                id: 1n,
                accountType: 'STUDENT',
                studentId: 42n,
                operatorAccountId: null,
            })
            ;(notificationRepository.markAsRead as jest.Mock).mockResolvedValue(
                updated
            )

            const result = await notificationService.markAsRead('1', {
                accountType: 'STUDENT',
                studentId: '42',
            })

            expect(notificationRepository.markAsRead).toHaveBeenCalledWith('1')
            expect(result).toBe(updated)
        })
    })

    describe('markAllAsRead', () => {
        it('should reject recipient without owner id', async () => {
            await expect(
                notificationService.markAllAsRead({ accountType: 'OPERATOR' })
            ).rejects.toMatchObject({
                statusCode: HttpStatus.UNAUTHORIZED,
            })
        })

        it('should mark all unread notifications for operator recipient', async () => {
            ;(notificationRepository.markAllAsRead as jest.Mock).mockResolvedValue({
                count: 3,
            })

            const result = await notificationService.markAllAsRead({
                accountType: 'OPERATOR',
                operatorAccountId: '9',
            })

            expect(notificationRepository.markAllAsRead).toHaveBeenCalledWith({
                accountType: 'OPERATOR',
                operatorAccountId: '9',
            })
            expect(result).toEqual({ count: 3 })
        })
    })
})
