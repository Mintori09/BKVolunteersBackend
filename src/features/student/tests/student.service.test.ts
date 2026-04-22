import * as studentService from '../student.service'
import * as studentRepo from '../student.repository'
import * as pointTransactionRepo from '../../gamification/pointTransaction.repository'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'

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

jest.mock('../student.repository')
jest.mock('../../gamification/pointTransaction.repository')

describe('Student Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getMyProfile', () => {
        it('should return student profile with titles when student exists', async () => {
            const studentId = 'student-1'
            const mockStudent = {
                id: studentId,
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT01',
                phone: '0123456789',
                totalPoints: 100,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-06-01'),
                titles: [
                    {
                        title: {
                            id: 1,
                            name: 'Bronze',
                            description: 'Bronze level volunteer',
                            minPoints: 0,
                            iconUrl: 'bronze.png',
                            badgeColor: '#cd7f32',
                        },
                        unlockedAt: new Date('2024-01-15'),
                    },
                ],
            }
            ;(studentRepo.findByIdWithTitles as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentService.getMyProfile(studentId)

            expect(studentRepo.findByIdWithTitles).toHaveBeenCalledWith(studentId)
            expect(result).toEqual({
                id: studentId,
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT01',
                phone: '0123456789',
                totalPoints: 100,
                titles: [
                    {
                        titleId: 1,
                        name: 'Bronze',
                        description: 'Bronze level volunteer',
                        minPoints: 0,
                        iconUrl: 'bronze.png',
                        badgeColor: '#cd7f32',
                        unlockedAt: new Date('2024-01-15'),
                    },
                ],
                createdAt: mockStudent.createdAt,
                updatedAt: mockStudent.updatedAt,
            })
        })

        it('should throw ApiError NOT_FOUND when student does not exist', async () => {
            const studentId = 'nonexistent'
            ;(studentRepo.findByIdWithTitles as jest.Mock).mockResolvedValue(null)

            await expect(studentService.getMyProfile(studentId)).rejects.toThrow(
                new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
            )
        })

        it('should return profile with empty titles array when student has no titles', async () => {
            const studentId = 'student-1'
            const mockStudent = {
                id: studentId,
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT01',
                phone: '0123456789',
                totalPoints: 0,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
                titles: [],
            }
            ;(studentRepo.findByIdWithTitles as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentService.getMyProfile(studentId)

            expect(result.titles).toEqual([])
        })

        it('should return profile with null fields for optional data', async () => {
            const studentId = 'student-1'
            const mockStudent = {
                id: studentId,
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: null,
                className: null,
                phone: null,
                totalPoints: 0,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
                titles: [],
            }
            ;(studentRepo.findByIdWithTitles as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentService.getMyProfile(studentId)

            expect(result.facultyId).toBeNull()
            expect(result.className).toBeNull()
            expect(result.phone).toBeNull()
        })

        it('should handle multiple titles correctly', async () => {
            const studentId = 'student-1'
            const mockStudent = {
                id: studentId,
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT01',
                phone: '0123456789',
                totalPoints: 500,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-06-01'),
                titles: [
                    {
                        title: {
                            id: 1,
                            name: 'Bronze',
                            description: 'Bronze level',
                            minPoints: 0,
                            iconUrl: 'bronze.png',
                            badgeColor: '#cd7f32',
                        },
                        unlockedAt: new Date('2024-01-15'),
                    },
                    {
                        title: {
                            id: 2,
                            name: 'Silver',
                            description: 'Silver level',
                            minPoints: 100,
                            iconUrl: 'silver.png',
                            badgeColor: '#c0c0c0',
                        },
                        unlockedAt: new Date('2024-03-01'),
                    },
                ],
            }
            ;(studentRepo.findByIdWithTitles as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentService.getMyProfile(studentId)

            expect(result.titles).toHaveLength(2)
            expect(result.titles[0].titleId).toBe(1)
            expect(result.titles[1].titleId).toBe(2)
        })
    })

    describe('updateMyProfile', () => {
        it('should update profile and return updated student when student exists', async () => {
            const studentId = 'student-1'
            const updateData = { phone: '0987654321', className: 'CNTT02' }
            const mockExistingStudent = {
                id: studentId,
                mssv: '123456789',
                fullName: 'Nguyen Van A',
            }
            const mockUpdatedStudent = {
                id: studentId,
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT02',
                phone: '0987654321',
                totalPoints: 100,
            }
            ;(studentRepo.findById as jest.Mock).mockResolvedValue(
                mockExistingStudent
            )
            ;(studentRepo.updateProfile as jest.Mock).mockResolvedValue(
                mockUpdatedStudent
            )

            const result = await studentService.updateMyProfile(
                studentId,
                updateData
            )

            expect(studentRepo.findById).toHaveBeenCalledWith(studentId)
            expect(studentRepo.updateProfile).toHaveBeenCalledWith(
                studentId,
                updateData
            )
            expect(result).toEqual(mockUpdatedStudent)
        })

        it('should throw ApiError NOT_FOUND when student does not exist', async () => {
            const studentId = 'nonexistent'
            const updateData = { phone: '0987654321' }
            ;(studentRepo.findById as jest.Mock).mockResolvedValue(null)

            await expect(
                studentService.updateMyProfile(studentId, updateData)
            ).rejects.toThrow(
                new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
            )
            expect(studentRepo.updateProfile).not.toHaveBeenCalled()
        })

        it('should update only phone', async () => {
            const studentId = 'student-1'
            const updateData = { phone: '0987654321' }
            const mockExistingStudent = { id: studentId }
            const mockUpdatedStudent = {
                id: studentId,
                phone: '0987654321',
            }
            ;(studentRepo.findById as jest.Mock).mockResolvedValue(
                mockExistingStudent
            )
            ;(studentRepo.updateProfile as jest.Mock).mockResolvedValue(
                mockUpdatedStudent
            )

            const result = await studentService.updateMyProfile(
                studentId,
                updateData
            )

            expect(studentRepo.updateProfile).toHaveBeenCalledWith(studentId, {
                phone: '0987654321',
            })
            expect(result).toEqual(mockUpdatedStudent)
        })

        it('should update only className', async () => {
            const studentId = 'student-1'
            const updateData = { className: 'CNTT03' }
            const mockExistingStudent = { id: studentId }
            const mockUpdatedStudent = {
                id: studentId,
                className: 'CNTT03',
            }
            ;(studentRepo.findById as jest.Mock).mockResolvedValue(
                mockExistingStudent
            )
            ;(studentRepo.updateProfile as jest.Mock).mockResolvedValue(
                mockUpdatedStudent
            )

            const result = await studentService.updateMyProfile(
                studentId,
                updateData
            )

            expect(studentRepo.updateProfile).toHaveBeenCalledWith(studentId, {
                className: 'CNTT03',
            })
            expect(result).toEqual(mockUpdatedStudent)
        })

        it('should propagate repository errors', async () => {
            const studentId = 'student-1'
            const updateData = { phone: '0987654321' }
            const mockExistingStudent = { id: studentId }
            ;(studentRepo.findById as jest.Mock).mockResolvedValue(
                mockExistingStudent
            )
            ;(studentRepo.updateProfile as jest.Mock).mockRejectedValue(
                new Error('Database error')
            )

            await expect(
                studentService.updateMyProfile(studentId, updateData)
            ).rejects.toThrow('Database error')
        })
    })

    describe('getPointsHistory', () => {
        it('should return paginated points history with default values', async () => {
            const studentId = 'student-1'
            const query = {}
            const mockResult = {
                items: [
                    {
                        id: 'pt-1',
                        points: 10,
                        reason: 'Event participation',
                        sourceType: 'EVENT_PARTICIPATION',
                        sourceId: 'event-1',
                        createdAt: new Date('2024-01-15'),
                    },
                ],
                meta: {
                    total: 1,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                },
            }
            ;(pointTransactionRepo.findManyByStudentId as jest.Mock).mockResolvedValue(
                mockResult
            )

            const result = await studentService.getPointsHistory(studentId, query)

            expect(pointTransactionRepo.findManyByStudentId).toHaveBeenCalledWith(
                studentId,
                {
                    sourceType: undefined,
                    fromDate: undefined,
                    toDate: undefined,
                },
                1,
                10
            )
            expect(result).toEqual({
                items: [
                    {
                        id: 'pt-1',
                        points: 10,
                        reason: 'Event participation',
                        sourceType: 'EVENT_PARTICIPATION',
                        sourceId: 'event-1',
                        createdAt: new Date('2024-01-15'),
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

        it('should use custom page and limit from query', async () => {
            const studentId = 'student-1'
            const query = { page: 2, limit: 20 }
            const mockResult = {
                items: [],
                meta: { total: 50, page: 2, limit: 20, totalPages: 3 },
            }
            ;(pointTransactionRepo.findManyByStudentId as jest.Mock).mockResolvedValue(
                mockResult
            )

            const result = await studentService.getPointsHistory(studentId, query)

            expect(pointTransactionRepo.findManyByStudentId).toHaveBeenCalledWith(
                studentId,
                {
                    sourceType: undefined,
                    fromDate: undefined,
                    toDate: undefined,
                },
                2,
                20
            )
            expect(result.meta.page).toBe(2)
            expect(result.meta.limit).toBe(20)
        })

        it('should pass sourceType filter to repository', async () => {
            const studentId = 'student-1'
            const query = { sourceType: 'EVENT_PARTICIPATION' as const }
            const mockResult = {
                items: [],
                meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
            }
            ;(pointTransactionRepo.findManyByStudentId as jest.Mock).mockResolvedValue(
                mockResult
            )

            await studentService.getPointsHistory(studentId, query)

            expect(pointTransactionRepo.findManyByStudentId).toHaveBeenCalledWith(
                studentId,
                expect.objectContaining({
                    sourceType: 'EVENT_PARTICIPATION',
                }),
                1,
                10
            )
        })

        it('should pass date filters to repository', async () => {
            const studentId = 'student-1'
            const fromDate = new Date('2024-01-01')
            const toDate = new Date('2024-12-31')
            const query = { fromDate, toDate }
            const mockResult = {
                items: [],
                meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
            }
            ;(pointTransactionRepo.findManyByStudentId as jest.Mock).mockResolvedValue(
                mockResult
            )

            await studentService.getPointsHistory(studentId, query)

            expect(pointTransactionRepo.findManyByStudentId).toHaveBeenCalledWith(
                studentId,
                expect.objectContaining({
                    fromDate,
                    toDate,
                }),
                1,
                10
            )
        })

        it('should pass all filters to repository', async () => {
            const studentId = 'student-1'
            const query = {
                page: 3,
                limit: 15,
                sourceType: 'MONEY_DONATION' as const,
                fromDate: new Date('2024-01-01'),
                toDate: new Date('2024-06-30'),
            }
            const mockResult = {
                items: [],
                meta: { total: 0, page: 3, limit: 15, totalPages: 0 },
            }
            ;(pointTransactionRepo.findManyByStudentId as jest.Mock).mockResolvedValue(
                mockResult
            )

            const result = await studentService.getPointsHistory(studentId, query)

            expect(pointTransactionRepo.findManyByStudentId).toHaveBeenCalledWith(
                studentId,
                {
                    sourceType: 'MONEY_DONATION',
                    fromDate: query.fromDate,
                    toDate: query.toDate,
                },
                3,
                15
            )
            expect(result.meta.page).toBe(3)
            expect(result.meta.limit).toBe(15)
        })

        it('should return empty items array when no transactions', async () => {
            const studentId = 'student-1'
            const query = {}
            const mockResult = {
                items: [],
                meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
            }
            ;(pointTransactionRepo.findManyByStudentId as jest.Mock).mockResolvedValue(
                mockResult
            )

            const result = await studentService.getPointsHistory(studentId, query)

            expect(result.items).toEqual([])
            expect(result.meta.total).toBe(0)
        })

        it('should map point transaction fields correctly', async () => {
            const studentId = 'student-1'
            const query = {}
            const mockResult = {
                items: [
                    {
                        id: 'pt-1',
                        points: 50,
                        reason: 'Donation',
                        sourceType: 'MONEY_DONATION',
                        sourceId: 'donation-1',
                        createdAt: new Date('2024-02-20'),
                    },
                    {
                        id: 'pt-2',
                        points: 25,
                        reason: 'Bonus',
                        sourceType: 'BONUS',
                        sourceId: null,
                        createdAt: new Date('2024-03-10'),
                    },
                ],
                meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
            }
            ;(pointTransactionRepo.findManyByStudentId as jest.Mock).mockResolvedValue(
                mockResult
            )

            const result = await studentService.getPointsHistory(studentId, query)

            expect(result.items).toHaveLength(2)
            expect(result.items[0].id).toBe('pt-1')
            expect(result.items[0].points).toBe(50)
            expect(result.items[0].reason).toBe('Donation')
            expect(result.items[0].sourceType).toBe('MONEY_DONATION')
            expect(result.items[0].sourceId).toBe('donation-1')
            expect(result.items[1].sourceId).toBeNull()
        })
    })

    describe('getMyTitles', () => {
        it('should return student titles when student exists', async () => {
            const studentId = 'student-1'
            const mockStudent = {
                id: studentId,
                titles: [
                    {
                        title: {
                            id: 1,
                            name: 'Bronze',
                            description: 'Bronze level',
                            minPoints: 0,
                            iconUrl: 'bronze.png',
                            badgeColor: '#cd7f32',
                        },
                        unlockedAt: new Date('2024-01-15'),
                    },
                    {
                        title: {
                            id: 2,
                            name: 'Silver',
                            description: 'Silver level',
                            minPoints: 100,
                            iconUrl: 'silver.png',
                            badgeColor: '#c0c0c0',
                        },
                        unlockedAt: new Date('2024-03-01'),
                    },
                ],
            }
            ;(studentRepo.findByIdWithTitles as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentService.getMyTitles(studentId)

            expect(studentRepo.findByIdWithTitles).toHaveBeenCalledWith(studentId)
            expect(result).toHaveLength(2)
            expect(result[0]).toEqual({
                titleId: 1,
                name: 'Bronze',
                description: 'Bronze level',
                minPoints: 0,
                iconUrl: 'bronze.png',
                badgeColor: '#cd7f32',
                unlockedAt: new Date('2024-01-15'),
            })
            expect(result[1]).toEqual({
                titleId: 2,
                name: 'Silver',
                description: 'Silver level',
                minPoints: 100,
                iconUrl: 'silver.png',
                badgeColor: '#c0c0c0',
                unlockedAt: new Date('2024-03-01'),
            })
        })

        it('should throw ApiError NOT_FOUND when student does not exist', async () => {
            const studentId = 'nonexistent'
            ;(studentRepo.findByIdWithTitles as jest.Mock).mockResolvedValue(null)

            await expect(studentService.getMyTitles(studentId)).rejects.toThrow(
                new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
            )
        })

        it('should return empty array when student has no titles', async () => {
            const studentId = 'student-1'
            const mockStudent = {
                id: studentId,
                titles: [],
            }
            ;(studentRepo.findByIdWithTitles as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentService.getMyTitles(studentId)

            expect(result).toEqual([])
        })

        it('should handle title with null description', async () => {
            const studentId = 'student-1'
            const mockStudent = {
                id: studentId,
                titles: [
                    {
                        title: {
                            id: 1,
                            name: 'Basic',
                            description: null,
                            minPoints: 0,
                            iconUrl: null,
                            badgeColor: null,
                        },
                        unlockedAt: new Date('2024-01-01'),
                    },
                ],
            }
            ;(studentRepo.findByIdWithTitles as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentService.getMyTitles(studentId)

            expect(result[0].description).toBeNull()
            expect(result[0].iconUrl).toBeNull()
            expect(result[0].badgeColor).toBeNull()
        })
    })

    describe('getStudentById', () => {
        it('should return public student info when student exists', async () => {
            const studentId = 'student-1'
            const mockStudent = {
                id: studentId,
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT01',
                totalPoints: 100,
                titles: [],
            }
            ;(studentRepo.findByIdPublic as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentService.getStudentById(studentId)

            expect(studentRepo.findByIdPublic).toHaveBeenCalledWith(studentId)
            expect(result).toEqual({
                id: studentId,
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT01',
                totalPoints: 100,
                titles: [],
            })
        })

        it('should throw ApiError NOT_FOUND when student does not exist', async () => {
            const studentId = 'nonexistent'
            ;(studentRepo.findByIdPublic as jest.Mock).mockResolvedValue(null)

            await expect(studentService.getStudentById(studentId)).rejects.toThrow(
                new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
            )
        })

        it('should return public info with titles mapped correctly', async () => {
            const studentId = 'student-1'
            const mockStudent = {
                id: studentId,
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT01',
                totalPoints: 500,
                titles: [
                    {
                        title: {
                            id: 1,
                            name: 'Gold',
                            minPoints: 500,
                            iconUrl: 'gold.png',
                        },
                        unlockedAt: new Date('2024-01-01'),
                    },
                    {
                        title: {
                            id: 2,
                            name: 'Silver',
                            minPoints: 100,
                            iconUrl: 'silver.png',
                        },
                        unlockedAt: new Date('2024-03-01'),
                    },
                ],
            }
            ;(studentRepo.findByIdPublic as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentService.getStudentById(studentId)

            expect(result.titles).toHaveLength(2)
            expect(result.titles[0]).toEqual({
                titleId: 1,
                name: 'Gold',
                minPoints: 500,
                iconUrl: 'gold.png',
                unlockedAt: new Date('2024-01-01'),
            })
            expect(result.titles[1]).toEqual({
                titleId: 2,
                name: 'Silver',
                minPoints: 100,
                iconUrl: 'silver.png',
                unlockedAt: new Date('2024-03-01'),
            })
        })

        it('should return student info with null optional fields', async () => {
            const studentId = 'student-1'
            const mockStudent = {
                id: studentId,
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: null,
                className: null,
                totalPoints: 0,
                titles: [],
            }
            ;(studentRepo.findByIdPublic as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentService.getStudentById(studentId)

            expect(result.facultyId).toBeNull()
            expect(result.className).toBeNull()
        })

        it('should return empty titles array when student has no titles', async () => {
            const studentId = 'student-1'
            const mockStudent = {
                id: studentId,
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT01',
                totalPoints: 0,
                titles: [],
            }
            ;(studentRepo.findByIdPublic as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentService.getStudentById(studentId)

            expect(result.titles).toEqual([])
        })

        it('should propagate repository errors', async () => {
            const studentId = 'student-1'
            ;(studentRepo.findByIdPublic as jest.Mock).mockRejectedValue(
                new Error('Database connection error')
            )

            await expect(studentService.getStudentById(studentId)).rejects.toThrow(
                'Database connection error'
            )
        })
    })
})