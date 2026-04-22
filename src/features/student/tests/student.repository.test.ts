import * as studentRepo from '../student.repository'
import { prismaClient } from 'src/config'

jest.mock('src/config', () => ({
    prismaClient: {
        student: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}))

const mockPrismaClient = prismaClient as jest.Mocked<typeof prismaClient>

describe('Student Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('findById', () => {
        it('should return student with titles when found', async () => {
            const mockStudent = {
                id: 'student-1',
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT01',
                phone: '0123456789',
                totalPoints: 100,
                password: 'hashedpassword',
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-06-01'),
                titles: [
                    {
                        id: 'st-1',
                        studentId: 'student-1',
                        titleId: 1,
                        unlockedAt: new Date('2024-01-15'),
                        title: {
                            id: 1,
                            name: 'Bronze',
                            description: 'Bronze level',
                            minPoints: 0,
                            iconUrl: 'bronze.png',
                            badgeColor: '#cd7f32',
                        },
                    },
                ],
            }
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentRepo.findById('student-1')

            expect(mockPrismaClient.student.findUnique).toHaveBeenCalledWith({
                where: { id: 'student-1' },
                include: {
                    titles: {
                        include: {
                            title: true,
                        },
                        orderBy: { unlockedAt: 'desc' },
                    },
                },
            })
            expect(result).toEqual(mockStudent)
        })

        it('should return null when student not found', async () => {
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(
                null
            )

            const result = await studentRepo.findById('nonexistent')

            expect(result).toBeNull()
        })

        it('should return student with empty titles array when no titles', async () => {
            const mockStudent = {
                id: 'student-1',
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT01',
                phone: '0123456789',
                totalPoints: 0,
                password: 'hashedpassword',
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
                titles: [],
            }
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentRepo.findById('student-1')

            expect(result?.titles).toEqual([])
        })

        it('should throw error when database query fails', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(studentRepo.findById('student-1')).rejects.toThrow(
                'Database error'
            )
        })
    })

    describe('findByIdWithTitles', () => {
        it('should return student with selected fields and titles when found', async () => {
            const mockStudent = {
                id: 'student-1',
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
                            description: 'Bronze level',
                            minPoints: 0,
                            iconUrl: 'bronze.png',
                            badgeColor: '#cd7f32',
                        },
                        unlockedAt: new Date('2024-01-15'),
                    },
                ],
            }
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentRepo.findByIdWithTitles('student-1')

            expect(mockPrismaClient.student.findUnique).toHaveBeenCalledWith({
                where: { id: 'student-1' },
                select: {
                    id: true,
                    mssv: true,
                    fullName: true,
                    email: true,
                    facultyId: true,
                    className: true,
                    phone: true,
                    totalPoints: true,
                    createdAt: true,
                    updatedAt: true,
                    titles: {
                        include: {
                            title: {
                                select: {
                                    id: true,
                                    name: true,
                                    description: true,
                                    minPoints: true,
                                    iconUrl: true,
                                    badgeColor: true,
                                },
                            },
                        },
                        orderBy: { unlockedAt: 'desc' },
                    },
                },
            })
            expect(result).toEqual(mockStudent)
        })

        it('should return null when student not found', async () => {
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(
                null
            )

            const result = await studentRepo.findByIdWithTitles('nonexistent')

            expect(result).toBeNull()
        })

        it('should return student with null optional fields', async () => {
            const mockStudent = {
                id: 'student-1',
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
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentRepo.findByIdWithTitles('student-1')

            expect(result?.facultyId).toBeNull()
            expect(result?.className).toBeNull()
            expect(result?.phone).toBeNull()
        })

        it('should return multiple titles ordered by unlockedAt desc', async () => {
            const mockStudent = {
                id: 'student-1',
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
                            id: 2,
                            name: 'Silver',
                            description: 'Silver level',
                            minPoints: 100,
                            iconUrl: 'silver.png',
                            badgeColor: '#c0c0c0',
                        },
                        unlockedAt: new Date('2024-03-01'),
                    },
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
                ],
            }
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentRepo.findByIdWithTitles('student-1')

            expect(result?.titles).toHaveLength(2)
        })

        it('should throw error when database query fails', async () => {
            const dbError = new Error('Database connection error')
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                studentRepo.findByIdWithTitles('student-1')
            ).rejects.toThrow('Database connection error')
        })
    })

    describe('findByIdPublic', () => {
        it('should return public student info with titles when found', async () => {
            const mockStudent = {
                id: 'student-1',
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT01',
                totalPoints: 100,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-06-01'),
                titles: [
                    {
                        title: {
                            id: 1,
                            name: 'Bronze',
                            minPoints: 0,
                            iconUrl: 'bronze.png',
                        },
                        unlockedAt: new Date('2024-01-15'),
                    },
                ],
            }
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentRepo.findByIdPublic('student-1')

            expect(mockPrismaClient.student.findUnique).toHaveBeenCalledWith({
                where: { id: 'student-1' },
                select: {
                    id: true,
                    mssv: true,
                    fullName: true,
                    email: true,
                    facultyId: true,
                    className: true,
                    totalPoints: true,
                    createdAt: true,
                    updatedAt: true,
                    titles: {
                        include: {
                            title: {
                                select: {
                                    id: true,
                                    name: true,
                                    minPoints: true,
                                    iconUrl: true,
                                },
                            },
                        },
                        orderBy: { unlockedAt: 'desc' },
                    },
                },
            })
            expect(result).toEqual(mockStudent)
        })

        it('should return null when student not found', async () => {
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(
                null
            )

            const result = await studentRepo.findByIdPublic('nonexistent')

            expect(result).toBeNull()
        })

        it('should not include phone field (public view)', async () => {
            const mockStudent = {
                id: 'student-1',
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT01',
                totalPoints: 100,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
                titles: [],
            }
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentRepo.findByIdPublic('student-1')

            expect(result).not.toHaveProperty('phone')
        })

        it('should not include description and badgeColor in titles (public view)', async () => {
            const mockStudent = {
                id: 'student-1',
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT01',
                totalPoints: 100,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
                titles: [
                    {
                        title: {
                            id: 1,
                            name: 'Bronze',
                            minPoints: 0,
                            iconUrl: 'bronze.png',
                        },
                        unlockedAt: new Date('2024-01-15'),
                    },
                ],
            }
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentRepo.findByIdPublic('student-1')

            expect(result?.titles[0].title).not.toHaveProperty('description')
            expect(result?.titles[0].title).not.toHaveProperty('badgeColor')
        })

        it('should return student with null optional fields', async () => {
            const mockStudent = {
                id: 'student-1',
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: null,
                className: null,
                totalPoints: 0,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
                titles: [],
            }
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await studentRepo.findByIdPublic('student-1')

            expect(result?.facultyId).toBeNull()
            expect(result?.className).toBeNull()
        })

        it('should throw error when database query fails', async () => {
            const dbError = new Error('Connection timeout')
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                studentRepo.findByIdPublic('student-1')
            ).rejects.toThrow('Connection timeout')
        })
    })

    describe('updateProfile', () => {
        it('should update student phone and return updated student', async () => {
            const updateData = { phone: '0987654321' }
            const mockUpdatedStudent = {
                id: 'student-1',
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT01',
                phone: '0987654321',
                totalPoints: 100,
            }
            ;(mockPrismaClient.student.update as jest.Mock).mockResolvedValue(
                mockUpdatedStudent
            )

            const result = await studentRepo.updateProfile('student-1', updateData)

            expect(mockPrismaClient.student.update).toHaveBeenCalledWith({
                where: { id: 'student-1' },
                data: updateData,
                select: {
                    id: true,
                    mssv: true,
                    fullName: true,
                    email: true,
                    facultyId: true,
                    className: true,
                    phone: true,
                    totalPoints: true,
                },
            })
            expect(result).toEqual(mockUpdatedStudent)
        })

        it('should update student className and return updated student', async () => {
            const updateData = { className: 'CNTT02' }
            const mockUpdatedStudent = {
                id: 'student-1',
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT02',
                phone: '0123456789',
                totalPoints: 100,
            }
            ;(mockPrismaClient.student.update as jest.Mock).mockResolvedValue(
                mockUpdatedStudent
            )

            const result = await studentRepo.updateProfile('student-1', updateData)

            expect(mockPrismaClient.student.update).toHaveBeenCalledWith({
                where: { id: 'student-1' },
                data: { className: 'CNTT02' },
                select: expect.any(Object),
            })
            expect(result.className).toBe('CNTT02')
        })

        it('should update both phone and className', async () => {
            const updateData = { phone: '0987654321', className: 'CNTT03' }
            const mockUpdatedStudent = {
                id: 'student-1',
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT03',
                phone: '0987654321',
                totalPoints: 100,
            }
            ;(mockPrismaClient.student.update as jest.Mock).mockResolvedValue(
                mockUpdatedStudent
            )

            const result = await studentRepo.updateProfile('student-1', updateData)

            expect(mockPrismaClient.student.update).toHaveBeenCalledWith({
                where: { id: 'student-1' },
                data: updateData,
                select: expect.any(Object),
            })
            expect(result.phone).toBe('0987654321')
            expect(result.className).toBe('CNTT03')
        })

        it('should return selected fields only (not password)', async () => {
            const updateData = { phone: '0987654321' }
            const mockUpdatedStudent = {
                id: 'student-1',
                mssv: '123456789',
                fullName: 'Nguyen Van A',
                email: 'a@example.com',
                facultyId: 'faculty-1',
                className: 'CNTT01',
                phone: '0987654321',
                totalPoints: 100,
            }
            ;(mockPrismaClient.student.update as jest.Mock).mockResolvedValue(
                mockUpdatedStudent
            )

            const result = await studentRepo.updateProfile('student-1', updateData)

            expect(result).not.toHaveProperty('password')
            expect(result).not.toHaveProperty('createdAt')
            expect(result).not.toHaveProperty('updatedAt')
        })

        it('should throw error when database update fails', async () => {
            const updateData = { phone: '0987654321' }
            const dbError = new Error('Database update failed')
            ;(mockPrismaClient.student.update as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                studentRepo.updateProfile('student-1', updateData)
            ).rejects.toThrow('Database update failed')
        })

        it('should throw Prisma error when student does not exist', async () => {
            const updateData = { phone: '0987654321' }
            const prismaError = new Error('Record to update not found')
            ;(mockPrismaClient.student.update as jest.Mock).mockRejectedValue(
                prismaError
            )

            await expect(
                studentRepo.updateProfile('nonexistent', updateData)
            ).rejects.toThrow('Record to update not found')
        })
    })
})