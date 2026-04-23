import * as argon2 from 'argon2'
import * as userService from '../user.service'
import * as userRepository from '../user.repository'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'

jest.mock('../user.repository')
jest.mock('argon2')

describe('User Service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('createUser', () => {
        it('should allow DOANTRUONG to create a CLB account', async () => {
            ;(userRepository.findByUsername as jest.Mock).mockResolvedValue(null)
            ;(userRepository.findByEmail as jest.Mock).mockResolvedValue(null)
            ;(argon2.hash as jest.Mock).mockResolvedValue('hashed-password')
            ;(userRepository.createUser as jest.Mock).mockResolvedValue({
                id: 'user-1',
                username: 'clb01',
                email: 'clb01@example.com',
                role: 'CLB',
                facultyId: 1,
            })

            const result = await userService.createUser(
                {
                    username: 'clb01',
                    email: 'clb01@example.com',
                    password: 'Password123!',
                    role: 'CLB',
                    facultyId: 1,
                },
                { userId: 'admin-1', role: 'DOANTRUONG' }
            )

            expect(userRepository.createUser).toHaveBeenCalledWith({
                username: 'clb01',
                email: 'clb01@example.com',
                password: 'hashed-password',
                role: 'CLB',
                facultyId: 1,
            })
            expect(result.role).toBe('CLB')
        })

        it('should return a user payload without password hash', async () => {
            ;(userRepository.findByUsername as jest.Mock).mockResolvedValue(null)
            ;(userRepository.findByEmail as jest.Mock).mockResolvedValue(null)
            ;(argon2.hash as jest.Mock).mockResolvedValue('hashed-password')
            ;(userRepository.createUser as jest.Mock).mockResolvedValue({
                id: 'user-1',
                username: 'clb01',
                email: 'clb01@example.com',
                role: 'CLB',
                facultyId: 1,
                createdAt: new Date('2026-04-23T00:00:00.000Z'),
                updatedAt: new Date('2026-04-23T00:00:00.000Z'),
                deletedAt: null,
            })

            const result = await userService.createUser(
                {
                    username: 'clb01',
                    email: 'clb01@example.com',
                    password: 'Password123!',
                    role: 'CLB',
                    facultyId: 1,
                },
                { userId: 'admin-1', role: 'DOANTRUONG' }
            )

            expect(result).not.toHaveProperty('password')
        })

        it('should reject non-DOANTRUONG creator', async () => {
            await expect(
                userService.createUser(
                    {
                        username: 'lcd01',
                        email: 'lcd01@example.com',
                        password: 'Password123!',
                        role: 'LCD',
                    },
                    { userId: 'user-1', role: 'LCD' }
                )
            ).rejects.toThrow(
                new ApiError(
                    HttpStatus.FORBIDDEN,
                    'Bạn không có quyền tạo tài khoản'
                )
            )
        })
    })
})
