import * as authRepository from '../auth.repository'
import { prismaClient } from 'src/config'

jest.mock('src/config', () => ({
    prismaClient: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        student: {
            findUnique: jest.fn(),
        },
        userRefreshToken: {
            findUnique: jest.fn(),
            create: jest.fn(),
            deleteMany: jest.fn(),
        },
    },
}))

const mockPrismaClient = prismaClient as any

describe('Auth Repository', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('gets manager user by username and maps role', async () => {
        mockPrismaClient.user.findUnique.mockResolvedValue({
            id: 'u1',
            username: 'manager01',
            email: 'manager@example.com',
            role: 'LCD',
            avatarFileId: 'file-1',
            passwordHash: 'hash',
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            managerProfile: {
                id: 'manager-1',
                facultyId: 1,
                managedClubId: 'club-1',
            },
            studentProfile: null,
        })

        const result = await authRepository.getUserByUsername('manager01')

        expect(result).toEqual(
            expect.objectContaining({
                id: 'u1',
                role: 'LCD',
                avatarFileId: 'file-1',
                managerAccountId: 'manager-1',
                facultyId: 1,
                managedClubId: 'club-1',
                passwordHash: 'hash',
            })
        )
    })

    it('gets student user by mssv and maps student fields', async () => {
        mockPrismaClient.student.findUnique.mockResolvedValue({
            id: 's1',
            mssv: '123456789',
            fullName: 'Nguyen Van A',
            facultyId: 1,
            className: '22TCLC',
            phone: '0909',
            totalPoints: 10,
            user: {
                id: 'u2',
                email: 'student@example.com',
                avatarFileId: 'file-student',
                status: 'ACTIVE',
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
                passwordHash: 'hash-student',
            },
        })

        const result = await authRepository.getUserByMssv('123456789')

        expect(result).toEqual(
            expect.objectContaining({
                id: 'u2',
                role: 'SINHVIEN',
                username: '123456789',
                avatarFileId: 'file-student',
                studentProfileId: 's1',
                mssv: '123456789',
                passwordHash: 'hash-student',
            })
        )
    })

    it('filters by role when getting user by id', async () => {
        mockPrismaClient.user.findUnique.mockResolvedValue({
            id: 'u3',
            username: 'manager02',
            email: 'manager2@example.com',
            role: 'CLB',
            passwordHash: 'hash',
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
            managerProfile: { facultyId: 2 },
            studentProfile: null,
        })

        const matched = await authRepository.getUserById('u3', 'CLB')
        const mismatched = await authRepository.getUserById('u3', 'LCD')

        expect(matched).toBeTruthy()
        expect(mismatched).toBeNull()
    })

    it('gets refresh token from userRefreshToken table', async () => {
        mockPrismaClient.userRefreshToken.findUnique.mockResolvedValue({
            id: 'rt1',
            token: 'token-1',
            userId: 'u1',
        })

        const result = await authRepository.getRefreshTokenByToken('token-1')

        expect(result).toEqual(
            expect.objectContaining({
                token: 'token-1',
                userId: 'u1',
                userType: 'user',
            })
        )
    })

    it('deletes refresh token by token', async () => {
        await authRepository.deleteRefreshToken('token-x')
        expect(
            mockPrismaClient.userRefreshToken.deleteMany
        ).toHaveBeenCalledWith({ where: { token: 'token-x' } })
    })

    it('deletes all refresh tokens by user id', async () => {
        await authRepository.deleteAllUserRefreshTokens('u9')
        expect(
            mockPrismaClient.userRefreshToken.deleteMany
        ).toHaveBeenCalledWith({ where: { userId: 'u9' } })
    })

    it('creates refresh token in userRefreshToken table', async () => {
        await authRepository.createRefreshToken('u1', 'token-new', 'LCD')
        expect(mockPrismaClient.userRefreshToken.create).toHaveBeenCalledWith({
            data: { userId: 'u1', token: 'token-new' },
        })
    })

    it('updates user passwordHash and lastLoginAt', async () => {
        await authRepository.updatePassword('u10', 'hash-new', 'LCD')
        await authRepository.updateLastLoginAt('u10')

        expect(mockPrismaClient.user.update).toHaveBeenNthCalledWith(1, {
            where: { id: 'u10' },
            data: { passwordHash: 'hash-new' },
        })
        expect(mockPrismaClient.user.update).toHaveBeenNthCalledWith(2, {
            where: { id: 'u10' },
            data: { lastLoginAt: expect.any(Date) },
        })
    })
})
