import * as notificationService from '../notification.service'
import * as notificationRepository from '../notification.repository'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'

jest.mock('../notification.repository')

describe('Notification Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getMyNotifications', () => {
        it('should list notifications for a student', async () => {
            ;(notificationRepository.findMine as jest.Mock).mockResolvedValue({
                items: [{ id: 'n-1', isRead: false }],
                meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
            })

            const result = await notificationService.getMyNotifications(
                { studentId: 'student-1' },
                { page: 1, limit: 10 }
            )

            expect(notificationRepository.findMine).toHaveBeenCalledWith(
                { studentId: 'student-1' },
                { page: 1, limit: 10 }
            )
            expect(result.items).toHaveLength(1)
        })
    })

    describe('markAsRead', () => {
        it('should mark one notification as read for the recipient', async () => {
            ;(notificationRepository.findById as jest.Mock).mockResolvedValue({
                id: 'n-1',
                recipientStudentId: 'student-1',
                recipientUserId: null,
            })
            ;(notificationRepository.markAsRead as jest.Mock).mockResolvedValue({
                id: 'n-1',
                isRead: true,
            })

            const result = await notificationService.markAsRead('n-1', {
                studentId: 'student-1',
            })

            expect(notificationRepository.markAsRead).toHaveBeenCalledWith(
                'n-1'
            )
            expect(result.isRead).toBe(true)
        })

        it('should throw when notification belongs to another recipient', async () => {
            ;(notificationRepository.findById as jest.Mock).mockResolvedValue({
                id: 'n-1',
                recipientStudentId: 'student-2',
                recipientUserId: null,
            })

            await expect(
                notificationService.markAsRead('n-1', {
                    studentId: 'student-1',
                })
            ).rejects.toThrow(
                new ApiError(
                    HttpStatus.FORBIDDEN,
                    'Bạn không có quyền thao tác thông báo này'
                )
            )
        })
    })

    describe('markAllAsRead', () => {
        it('should mark all notifications as read for a user', async () => {
            ;(notificationRepository.markAllAsRead as jest.Mock).mockResolvedValue(
                { count: 3 }
            )

            const result = await notificationService.markAllAsRead({
                userId: 'user-1',
            })

            expect(notificationRepository.markAllAsRead).toHaveBeenCalledWith({
                userId: 'user-1',
            })
            expect(result.count).toBe(3)
        })
    })
})
