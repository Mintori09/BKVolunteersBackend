import * as authRepository from '../auth.repository'
import { prismaClient } from 'src/config'
import { UserRole } from '../types'

jest.mock('src/config', () => ({
    prismaClient: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        student: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        refreshToken: {
            findUnique: jest.fn(),
            create: jest.fn(),
            deleteMany: jest.fn(),
        },
        studentRefreshToken: {
            findUnique: jest.fn(),
            create: jest.fn(),
            deleteMany: jest.fn(),
        },
    },
}))

const mockPrismaClient = prismaClient as jest.Mocked<typeof prismaClient>

describe('Auth Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getUserByEmail', () => {
        it('should return user when found', async () => {
            const mockUser = { id: '1', email: 'test@test.com' }
            ;(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(
                mockUser
            )

            const result = await authRepository.getUserByEmail('test@test.com')

            expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'test@test.com' },
            })
            expect(result).toEqual(mockUser)
        })

        it('should return null when user not found', async () => {
            ;(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(
                null
            )

            const result = await authRepository.getUserByEmail(
                'notfound@test.com'
            )

            expect(result).toBeNull()
        })

        it('should throw error when database query fails', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.user.findUnique as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                authRepository.getUserByEmail('test@test.com')
            ).rejects.toThrow('Database error')
        })
    })

    describe('getUserByUsername', () => {
        it('should return user when found', async () => {
            const mockUser = { id: '1', username: 'testuser' }
            ;(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(
                mockUser
            )

            const result = await authRepository.getUserByUsername('testuser')

            expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
                where: { username: 'testuser' },
            })
            expect(result).toEqual(mockUser)
        })

        it('should return null when user not found', async () => {
            ;(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(
                null
            )

            const result = await authRepository.getUserByUsername('notfound')

            expect(result).toBeNull()
        })

        it('should throw error when database query fails', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.user.findUnique as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                authRepository.getUserByUsername('testuser')
            ).rejects.toThrow('Database error')
        })
    })

    describe('getUserByMssv', () => {
        it('should return student when found', async () => {
            const mockStudent = { id: '1', mssv: '12345678' }
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await authRepository.getUserByMssv('12345678')

            expect(mockPrismaClient.student.findUnique).toHaveBeenCalledWith({
                where: { mssv: '12345678' },
            })
            expect(result).toEqual(mockStudent)
        })

        it('should return null when student not found', async () => {
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(
                null
            )

            const result = await authRepository.getUserByMssv('00000000')

            expect(result).toBeNull()
        })

        it('should throw error when database query fails', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                authRepository.getUserByMssv('12345678')
            ).rejects.toThrow('Database error')
        })
    })

    describe('getUserById', () => {
        it('should return student when role is SINHVIEN', async () => {
            const mockStudent = { id: '1', mssv: '12345678' }
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await authRepository.getUserById('1', 'SINHVIEN')

            expect(mockPrismaClient.student.findUnique).toHaveBeenCalledWith({
                where: { id: '1' },
            })
            expect(result).toEqual(mockStudent)
        })

        it('should return user when role is not SINHVIEN', async () => {
            const mockUser = { id: '1', username: 'testuser' }
            ;(mockPrismaClient.user.findUnique as jest.Mock).mockResolvedValue(
                mockUser
            )

            const result = await authRepository.getUserById('1', 'CLB')

            expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
                where: { id: '1' },
            })
            expect(result).toEqual(mockUser)
        })

        it('should throw error when database query fails for student', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.student.findUnique as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                authRepository.getUserById('1', 'SINHVIEN')
            ).rejects.toThrow('Database error')
        })

        it('should throw error when database query fails for user', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.user.findUnique as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                authRepository.getUserById('1', 'CLB')
            ).rejects.toThrow('Database error')
        })
    })

    describe('getRefreshTokenByToken', () => {
        it('should return user token with userType "user" when found', async () => {
            const mockToken = { id: '1', token: 'token123', userId: 'user1' }
            ;(mockPrismaClient.refreshToken.findUnique as jest.Mock).mockResolvedValue(
                mockToken
            )

            const result = await authRepository.getRefreshTokenByToken(
                'token123'
            )

            expect(mockPrismaClient.refreshToken.findUnique).toHaveBeenCalledWith(
                { where: { token: 'token123' } }
            )
            expect(result).toEqual({ ...mockToken, userType: 'user' })
        })

        it('should return student token with userType "student" when found', async () => {
            ;(mockPrismaClient.refreshToken.findUnique as jest.Mock).mockResolvedValue(
                null
            )
            const mockStudentToken = {
                id: '2',
                token: 'token456',
                studentId: 'student1',
            }
            ;(mockPrismaClient.studentRefreshToken.findUnique as jest.Mock).mockResolvedValue(
                mockStudentToken
            )

            const result = await authRepository.getRefreshTokenByToken(
                'token456'
            )

            expect(
                mockPrismaClient.studentRefreshToken.findUnique
            ).toHaveBeenCalledWith({ where: { token: 'token456' } })
            expect(result).toEqual({ ...mockStudentToken, userType: 'student' })
        })

        it('should return null when token not found', async () => {
            ;(mockPrismaClient.refreshToken.findUnique as jest.Mock).mockResolvedValue(
                null
            )
            ;(mockPrismaClient.studentRefreshToken.findUnique as jest.Mock).mockResolvedValue(
                null
            )

            const result = await authRepository.getRefreshTokenByToken(
                'notfound'
            )

            expect(result).toBeNull()
        })

        it('should throw error when database query fails for user token', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.refreshToken.findUnique as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                authRepository.getRefreshTokenByToken('token123')
            ).rejects.toThrow('Database error')
        })

        it('should throw error when database query fails for student token', async () => {
            ;(mockPrismaClient.refreshToken.findUnique as jest.Mock).mockResolvedValue(
                null
            )
            const dbError = new Error('Database error')
            ;(mockPrismaClient.studentRefreshToken.findUnique as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                authRepository.getRefreshTokenByToken('token123')
            ).rejects.toThrow('Database error')
        })
    })

    describe('deleteRefreshToken', () => {
        it('should delete from studentRefreshToken when role is SINHVIEN', async () => {
            await authRepository.deleteRefreshToken('token123', 'SINHVIEN')

            expect(
                mockPrismaClient.studentRefreshToken.deleteMany
            ).toHaveBeenCalledWith({ where: { token: 'token123' } })
            expect(
                mockPrismaClient.refreshToken.deleteMany
            ).not.toHaveBeenCalled()
        })

        it('should delete from refreshToken when role is defined but not SINHVIEN', async () => {
            await authRepository.deleteRefreshToken('token123', 'CLB')

            expect(
                mockPrismaClient.refreshToken.deleteMany
            ).toHaveBeenCalledWith({ where: { token: 'token123' } })
            expect(
                mockPrismaClient.studentRefreshToken.deleteMany
            ).not.toHaveBeenCalled()
        })

        it('should delete from both tables when role is undefined', async () => {
            await authRepository.deleteRefreshToken('token123')

            expect(
                mockPrismaClient.refreshToken.deleteMany
            ).toHaveBeenCalledWith({ where: { token: 'token123' } })
            expect(
                mockPrismaClient.studentRefreshToken.deleteMany
            ).toHaveBeenCalledWith({ where: { token: 'token123' } })
        })

        it('should throw error when delete fails for studentRefreshToken', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.studentRefreshToken.deleteMany as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                authRepository.deleteRefreshToken('token123', 'SINHVIEN')
            ).rejects.toThrow('Database error')
        })

        it('should throw error when delete fails for refreshToken', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.refreshToken.deleteMany as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                authRepository.deleteRefreshToken('token123', 'CLB')
            ).rejects.toThrow('Database error')
        })

        it('should throw error when delete fails for both tables', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.refreshToken.deleteMany as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                authRepository.deleteRefreshToken('token123')
            ).rejects.toThrow('Database error')
        })
    })

    describe('deleteAllUserRefreshTokens', () => {
        it('should delete from studentRefreshToken when role is SINHVIEN', async () => {
            ;(mockPrismaClient.studentRefreshToken.deleteMany as jest.Mock).mockResolvedValue(
                { count: 1 }
            )

            await authRepository.deleteAllUserRefreshTokens(
                'student1',
                'SINHVIEN'
            )

            expect(
                mockPrismaClient.studentRefreshToken.deleteMany
            ).toHaveBeenCalledWith({ where: { studentId: 'student1' } })
        })

        it('should delete from refreshToken when role is not SINHVIEN', async () => {
            ;(mockPrismaClient.refreshToken.deleteMany as jest.Mock).mockResolvedValue(
                { count: 1 }
            )

            await authRepository.deleteAllUserRefreshTokens('user1', 'CLB')

            expect(
                mockPrismaClient.refreshToken.deleteMany
            ).toHaveBeenCalledWith({ where: { userId: 'user1' } })
        })

        it('should throw error when delete fails for studentRefreshToken', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.studentRefreshToken.deleteMany as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                authRepository.deleteAllUserRefreshTokens('student1', 'SINHVIEN')
            ).rejects.toThrow('Database error')
        })

        it('should throw error when delete fails for refreshToken', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.refreshToken.deleteMany as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                authRepository.deleteAllUserRefreshTokens('user1', 'CLB')
            ).rejects.toThrow('Database error')
        })
    })

    describe('createRefreshToken', () => {
        it('should create in studentRefreshToken when role is SINHVIEN', async () => {
            const mockToken = { id: '1', token: 'token123', studentId: 'student1' }
            ;(mockPrismaClient.studentRefreshToken.create as jest.Mock).mockResolvedValue(
                mockToken
            )

            const result = await authRepository.createRefreshToken(
                'student1',
                'token123',
                'SINHVIEN'
            )

            expect(
                mockPrismaClient.studentRefreshToken.create
            ).toHaveBeenCalledWith({
                data: { token: 'token123', studentId: 'student1' },
            })
            expect(result).toEqual(mockToken)
        })

        it('should create in refreshToken when role is not SINHVIEN', async () => {
            const mockToken = { id: '1', token: 'token123', userId: 'user1' }
            ;(mockPrismaClient.refreshToken.create as jest.Mock).mockResolvedValue(
                mockToken
            )

            const result = await authRepository.createRefreshToken(
                'user1',
                'token123',
                'CLB'
            )

            expect(mockPrismaClient.refreshToken.create).toHaveBeenCalledWith({
                data: { token: 'token123', userId: 'user1' },
            })
            expect(result).toEqual(mockToken)
        })

        it('should throw error when create fails for studentRefreshToken', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.studentRefreshToken.create as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                authRepository.createRefreshToken('student1', 'token123', 'SINHVIEN')
            ).rejects.toThrow('Database error')
        })

        it('should throw error when create fails for refreshToken', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.refreshToken.create as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                authRepository.createRefreshToken('user1', 'token123', 'CLB')
            ).rejects.toThrow('Database error')
        })
    })

    describe('updatePassword', () => {
        it('should update student password when role is SINHVIEN', async () => {
            const mockStudent = { id: '1', password: 'newHashedPassword' }
            ;(mockPrismaClient.student.update as jest.Mock).mockResolvedValue(
                mockStudent
            )

            const result = await authRepository.updatePassword(
                'student1',
                'newHashedPassword',
                'SINHVIEN'
            )

            expect(mockPrismaClient.student.update).toHaveBeenCalledWith({
                where: { id: 'student1' },
                data: { password: 'newHashedPassword' },
            })
            expect(result).toEqual(mockStudent)
        })

        it('should update user password when role is not SINHVIEN', async () => {
            const mockUser = { id: '1', password: 'newHashedPassword' }
            ;(mockPrismaClient.user.update as jest.Mock).mockResolvedValue(
                mockUser
            )

            const result = await authRepository.updatePassword(
                'user1',
                'newHashedPassword',
                'CLB'
            )

            expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
                where: { id: 'user1' },
                data: { password: 'newHashedPassword' },
            })
            expect(result).toEqual(mockUser)
        })

        it('should throw error when update fails for student', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.student.update as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                authRepository.updatePassword(
                    'student1',
                    'newHashedPassword',
                    'SINHVIEN'
                )
            ).rejects.toThrow('Database error')
        })

        it('should throw error when update fails for user', async () => {
            const dbError = new Error('Database error')
            ;(mockPrismaClient.user.update as jest.Mock).mockRejectedValue(
                dbError
            )

            await expect(
                authRepository.updatePassword('user1', 'newHashedPassword', 'CLB')
            ).rejects.toThrow('Database error')
        })
    })
})
