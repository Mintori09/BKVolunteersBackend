import { HttpStatus } from 'src/common/constants'
import {
    getMe,
    updateMe,
    getPointsHistory,
    getMyTitles,
    getStudentById,
} from 'src/features/student/student.controller'
import * as studentService from '../student.service'
import { ApiError } from 'src/utils/ApiError'
import { NextFunction } from 'express'

jest.mock('src/config', () => ({
    prismaClient: {},
    config: {
        node_env: 'test',
        jwt: {
            refresh_token: {
                cookie_name: 'refresh_token',
                secret: 'secret',
            },
            access_token: {
                secret: 'secret',
            },
        },
    },
    refreshTokenCookieConfig: {},
    clearRefreshTokenCookieConfig: {},
}))

jest.mock('../student.service')

describe('Student Controller', () => {
    let req: any
    let res: any
    let next: NextFunction

    beforeEach(() => {
        req = {
            body: {},
            cookies: {},
            params: {},
            query: {},
            payload: undefined,
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            sendStatus: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis(),
        }
        next = jest.fn()
        jest.clearAllMocks()
    })

    describe('getMe', () => {
        it('should call next with ApiError if no userId in payload', async () => {
            req.payload = {}

            await getMe(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
            expect((next as jest.Mock).mock.calls[0][0].message).toBe(
                'Chưa xác thực người dùng'
            )
        })

        it('should call next with ApiError if no role in payload', async () => {
            req.payload = { userId: 'student-1' }

            await getMe(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should call next with ApiError if role is not SINHVIEN', async () => {
            req.payload = { userId: 'user-1', role: 'CLB' }

            await getMe(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should call next with ApiError if role is LCD', async () => {
            req.payload = { userId: 'user-1', role: 'LCD' }

            await getMe(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should call next with ApiError if role is DOANTRUONG', async () => {
            req.payload = { userId: 'user-1', role: 'DOANTRUONG' }

            await getMe(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should return student profile if authorized as SINHVIEN', async () => {
            req.payload = { userId: 'student-1', role: 'SINHVIEN' }
            const mockProfile = {
                id: 'student-1',
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT01',
                phone: '0123456789',
                totalPoints: 100,
                titles: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            ;(studentService.getMyProfile as jest.Mock).mockResolvedValue(
                mockProfile
            )

            await getMe(req, res, next)

            expect(studentService.getMyProfile).toHaveBeenCalledWith('student-1')
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockProfile,
                })
            )
        })

        it('should call next with ApiError if service throws error', async () => {
            req.payload = { userId: 'student-1', role: 'SINHVIEN' }
            ;(studentService.getMyProfile as jest.Mock).mockRejectedValue(
                new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
            )

            await getMe(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.NOT_FOUND
            )
        })
    })

    describe('updateMe', () => {
        it('should call next with ApiError if no userId in payload', async () => {
            req.payload = {}
            req.body = { phone: '0123456789' }

            await updateMe(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should call next with ApiError if role is not SINHVIEN', async () => {
            req.payload = { userId: 'user-1', role: 'CLB' }
            req.body = { phone: '0123456789' }

            await updateMe(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should call updateMyProfile service and return updated profile', async () => {
            req.payload = { userId: 'student-1', role: 'SINHVIEN' }
            req.body = { phone: '0123456789', className: 'CNTT02' }
            const mockUpdatedProfile = {
                id: 'student-1',
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT02',
                phone: '0123456789',
                totalPoints: 100,
            }
            ;(studentService.updateMyProfile as jest.Mock).mockResolvedValue(
                mockUpdatedProfile
            )

            await updateMe(req, res, next)

            expect(studentService.updateMyProfile).toHaveBeenCalledWith(
                'student-1',
                req.body
            )
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockUpdatedProfile,
                    message: 'Cập nhật thành công',
                })
            )
        })

        it('should call updateMyProfile service with only phone', async () => {
            req.payload = { userId: 'student-1', role: 'SINHVIEN' }
            req.body = { phone: '0123456789' }
            const mockUpdatedProfile = {
                id: 'student-1',
                phone: '0123456789',
            }
            ;(studentService.updateMyProfile as jest.Mock).mockResolvedValue(
                mockUpdatedProfile
            )

            await updateMe(req, res, next)

            expect(studentService.updateMyProfile).toHaveBeenCalledWith(
                'student-1',
                { phone: '0123456789' }
            )
            expect(res.json).toHaveBeenCalled()
        })

        it('should call next with ApiError if student not found', async () => {
            req.payload = { userId: 'student-1', role: 'SINHVIEN' }
            req.body = { phone: '0123456789' }
            ;(studentService.updateMyProfile as jest.Mock).mockRejectedValue(
                new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
            )

            await updateMe(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.NOT_FOUND
            )
        })
    })

    describe('getPointsHistory', () => {
        it('should call next with ApiError if no userId in payload', async () => {
            req.payload = {}

            await getPointsHistory(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should call next with ApiError if role is not SINHVIEN', async () => {
            req.payload = { userId: 'user-1', role: 'CLB' }

            await getPointsHistory(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should return points history with default pagination', async () => {
            req.payload = { userId: 'student-1', role: 'SINHVIEN' }
            req.query = {}
            const mockHistory = {
                items: [
                    {
                        id: 'pt-1',
                        points: 10,
                        reason: 'Event participation',
                        sourceType: 'EVENT_PARTICIPATION',
                        sourceId: 'event-1',
                        createdAt: new Date(),
                    },
                ],
                meta: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                },
            }
            ;(studentService.getPointsHistory as jest.Mock).mockResolvedValue(
                mockHistory
            )

            await getPointsHistory(req, res, next)

            expect(studentService.getPointsHistory).toHaveBeenCalledWith(
                'student-1',
                {
                    page: undefined,
                    limit: undefined,
                    sourceType: undefined,
                    fromDate: undefined,
                    toDate: undefined,
                }
            )
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockHistory,
                })
            )
        })

        it('should parse and pass page and limit query params', async () => {
            req.payload = { userId: 'student-1', role: 'SINHVIEN' }
            req.query = { page: '2', limit: '20' }
            const mockHistory = {
                items: [],
                meta: { total: 0, page: 2, limit: 20, totalPages: 0 },
            }
            ;(studentService.getPointsHistory as jest.Mock).mockResolvedValue(
                mockHistory
            )

            await getPointsHistory(req, res, next)

            expect(studentService.getPointsHistory).toHaveBeenCalledWith(
                'student-1',
                {
                    page: 2,
                    limit: 20,
                    sourceType: undefined,
                    fromDate: undefined,
                    toDate: undefined,
                }
            )
        })

        it('should pass sourceType filter to service', async () => {
            req.payload = { userId: 'student-1', role: 'SINHVIEN' }
            req.query = { sourceType: 'EVENT_PARTICIPATION' }
            const mockHistory = {
                items: [],
                meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
            }
            ;(studentService.getPointsHistory as jest.Mock).mockResolvedValue(
                mockHistory
            )

            await getPointsHistory(req, res, next)

            expect(studentService.getPointsHistory).toHaveBeenCalledWith(
                'student-1',
                expect.objectContaining({
                    sourceType: 'EVENT_PARTICIPATION',
                })
            )
        })

        it('should pass date filters to service', async () => {
            req.payload = { userId: 'student-1', role: 'SINHVIEN' }
            req.query = {
                fromDate: '2024-01-01',
                toDate: '2024-12-31',
            }
            const mockHistory = {
                items: [],
                meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
            }
            ;(studentService.getPointsHistory as jest.Mock).mockResolvedValue(
                mockHistory
            )

            await getPointsHistory(req, res, next)

            expect(studentService.getPointsHistory).toHaveBeenCalledWith(
                'student-1',
                expect.objectContaining({
                    fromDate: '2024-01-01',
                    toDate: '2024-12-31',
                })
            )
        })

        it('should pass all query params to service', async () => {
            req.payload = { userId: 'student-1', role: 'SINHVIEN' }
            req.query = {
                page: '1',
                limit: '5',
                sourceType: 'MONEY_DONATION',
                fromDate: '2024-01-01',
                toDate: '2024-06-30',
            }
            const mockHistory = {
                items: [],
                meta: { total: 0, page: 1, limit: 5, totalPages: 0 },
            }
            ;(studentService.getPointsHistory as jest.Mock).mockResolvedValue(
                mockHistory
            )

            await getPointsHistory(req, res, next)

            expect(studentService.getPointsHistory).toHaveBeenCalledWith(
                'student-1',
                {
                    page: 1,
                    limit: 5,
                    sourceType: 'MONEY_DONATION',
                    fromDate: '2024-01-01',
                    toDate: '2024-06-30',
                }
            )
        })

        it('should call next with ApiError if service throws error', async () => {
            req.payload = { userId: 'student-1', role: 'SINHVIEN' }
            ;(studentService.getPointsHistory as jest.Mock).mockRejectedValue(
                new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Database error')
            )

            await getPointsHistory(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
        })
    })

    describe('getMyTitles', () => {
        it('should call next with ApiError if no userId in payload', async () => {
            req.payload = {}

            await getMyTitles(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should call next with ApiError if role is not SINHVIEN', async () => {
            req.payload = { userId: 'user-1', role: 'LCD' }

            await getMyTitles(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.UNAUTHORIZED
            )
        })

        it('should return student titles if authorized as SINHVIEN', async () => {
            req.payload = { userId: 'student-1', role: 'SINHVIEN' }
            const mockTitles = [
                {
                    titleId: 1,
                    name: 'Bronze',
                    description: 'Bronze level',
                    minPoints: 0,
                    iconUrl: 'icon.png',
                    badgeColor: '#cd7f32',
                    unlockedAt: new Date('2024-01-01'),
                },
            ]
            ;(studentService.getMyTitles as jest.Mock).mockResolvedValue(
                mockTitles
            )

            await getMyTitles(req, res, next)

            expect(studentService.getMyTitles).toHaveBeenCalledWith('student-1')
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockTitles,
                })
            )
        })

        it('should return empty array if student has no titles', async () => {
            req.payload = { userId: 'student-1', role: 'SINHVIEN' }
            ;(studentService.getMyTitles as jest.Mock).mockResolvedValue([])

            await getMyTitles(req, res, next)

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: [],
                })
            )
        })

        it('should call next with ApiError if service throws error', async () => {
            req.payload = { userId: 'student-1', role: 'SINHVIEN' }
            ;(studentService.getMyTitles as jest.Mock).mockRejectedValue(
                new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
            )

            await getMyTitles(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.NOT_FOUND
            )
        })
    })

    describe('getStudentById', () => {
        it('should return student public info by id', async () => {
            req.params = { id: 'student-1' }
            const mockPublicInfo = {
                id: 'student-1',
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT01',
                totalPoints: 100,
                titles: [],
            }
            ;(studentService.getStudentById as jest.Mock).mockResolvedValue(
                mockPublicInfo
            )

            await getStudentById(req, res, next)

            expect(studentService.getStudentById).toHaveBeenCalledWith('student-1')
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockPublicInfo,
                })
            )
        })

        it('should return student public info with titles', async () => {
            req.params = { id: 'student-1' }
            const mockPublicInfo = {
                id: 'student-1',
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT01',
                totalPoints: 100,
                titles: [
                    {
                        titleId: 1,
                        name: 'Gold',
                        minPoints: 500,
                        iconUrl: 'gold.png',
                        unlockedAt: new Date('2024-01-01'),
                    },
                ],
            }
            ;(studentService.getStudentById as jest.Mock).mockResolvedValue(
                mockPublicInfo
            )

            await getStudentById(req, res, next)

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: mockPublicInfo,
                })
            )
        })

        it('should call next with ApiError if student not found', async () => {
            req.params = { id: 'nonexistent' }
            ;(studentService.getStudentById as jest.Mock).mockRejectedValue(
                new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
            )

            await getStudentById(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(ApiError))
            expect((next as jest.Mock).mock.calls[0][0].statusCode).toBe(
                HttpStatus.NOT_FOUND
            )
        })

        it('should call next with error if service throws database error', async () => {
            req.params = { id: 'student-1' }
            ;(studentService.getStudentById as jest.Mock).mockRejectedValue(
                new Error('Database connection error')
            )

            await getStudentById(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(Error))
        })
    })
})