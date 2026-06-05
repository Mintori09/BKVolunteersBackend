import { HttpStatus } from 'src/common/constants'
import { prismaClient } from 'src/config'
import { ApiError } from 'src/utils/ApiError'
import { updateUserStatus } from '../users.service'

jest.mock('src/config', () => ({
    prismaClient: {
        user: {
            findFirst: jest.fn(),
            update: jest.fn(),
        },
        userRefreshToken: {
            deleteMany: jest.fn(),
        },
        $transaction: jest.fn(),
    },
}))

type MockedPrismaClient = {
    user: {
        findFirst: jest.Mock
        update: jest.Mock
    }
    userRefreshToken: {
        deleteMany: jest.Mock
    }
    $transaction: jest.Mock
}

const mockedPrismaClient = prismaClient as unknown as MockedPrismaClient

describe('users.service updateUserStatus', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockedPrismaClient.user.findFirst.mockResolvedValue({
            id: 'student-2',
            deletedAt: null,
            managerProfile: null,
            studentProfile: {
                userId: 'student-2',
            },
        })

        mockedPrismaClient.user.update.mockImplementation(
            async ({ where, data }: { where: { id: string }; data: { status: string } }) => ({
                id: where.id,
                status: data.status,
            })
        )

        mockedPrismaClient.userRefreshToken.deleteMany.mockResolvedValue({
            count: 2,
        })

        mockedPrismaClient.$transaction.mockImplementation(
            async (
                callback: (tx: {
                    user: MockedPrismaClient['user']
                    userRefreshToken: MockedPrismaClient['userRefreshToken']
                }) => Promise<unknown>
            ) =>
                callback({
                    user: mockedPrismaClient.user,
                    userRefreshToken: mockedPrismaClient.userRefreshToken,
                })
        )
    })

    it('rejects when actor tries to change their own account status', async () => {
        await expect(
            updateUserStatus('admin-1', { status: 'LOCKED' }, 'admin-1')
        ).rejects.toEqual(
            new ApiError(
                HttpStatus.BAD_REQUEST,
                'Khong the tu khoa mo tai khoan cua chinh minh'
            )
        )

        expect(mockedPrismaClient.user.findFirst).not.toHaveBeenCalled()
    })

    it('revokes refresh tokens before locking an account', async () => {
        await updateUserStatus('student-2', { status: 'LOCKED' }, 'admin-1')

        expect(mockedPrismaClient.user.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: 'student-2',
                    deletedAt: null,
                },
            })
        )
        expect(mockedPrismaClient.userRefreshToken.deleteMany).toHaveBeenCalledWith(
            {
                where: { userId: 'student-2' },
            }
        )
        expect(mockedPrismaClient.user.update).toHaveBeenCalledWith({
            where: { id: 'student-2' },
            data: {
                status: 'LOCKED',
            },
        })
    })

    it('updates account status without revoking refresh tokens when unlocking', async () => {
        await updateUserStatus('student-2', { status: 'ACTIVE' }, 'admin-1')

        expect(mockedPrismaClient.userRefreshToken.deleteMany).not.toHaveBeenCalled()
        expect(mockedPrismaClient.user.update).toHaveBeenCalledWith({
            where: { id: 'student-2' },
            data: {
                status: 'ACTIVE',
            },
        })
    })
})
