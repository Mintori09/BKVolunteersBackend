import { HttpStatus } from 'src/common/constants'
import * as authService from '../auth.service'
import * as authRepository from '../auth.repository'

jest.mock('src/config', () => ({
    prismaClient: {},
    config: {
        jwt: {
            access_token: { secret: 'test-secret', expire: '15m' },
            refresh_token: { secret: 'test-secret', expire: '7d' },
        },
    },
}))

jest.mock('../auth.repository')
jest.mock('src/utils/generateTokens.util', () => ({
    createAccessToken: jest.fn(() => 'mock-access-token'),
    createRefreshToken: jest.fn(() => 'mock-refresh-token'),
}))

describe('auth.service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getUserByEmail', () => {
        it('should look up operator account first', async () => {
            const mockOperator = { id: '1', email: 'admin@test.com', role: 'DOANTRUONG' }
            ;(authRepository.getUserByEmail as jest.Mock).mockResolvedValue(mockOperator)

            const result = await authService.getUserByEmail('admin@test.com')

            expect(authRepository.getUserByEmail).toHaveBeenCalledWith('admin@test.com')
            expect(authRepository.getUserByStudentEmail).not.toHaveBeenCalled()
            expect(result).toEqual(mockOperator)
        })

        it('should fall back to student email lookup', async () => {
            ;(authRepository.getUserByEmail as jest.Mock).mockResolvedValue(null)
            const mockStudent = { id: '2', email: 'student@sv1.dut.udn.vn', mssv: '102210001' }
            ;(authRepository.getUserByStudentEmail as jest.Mock).mockResolvedValue(mockStudent)

            const result = await authService.getUserByEmail('student@sv1.dut.udn.vn')

            expect(authRepository.getUserByStudentEmail).toHaveBeenCalled()
            expect(result).toEqual(mockStudent)
        })

        it('should return null if no user found', async () => {
            ;(authRepository.getUserByEmail as jest.Mock).mockResolvedValue(null)
            ;(authRepository.getUserByStudentEmail as jest.Mock).mockResolvedValue(null)

            const result = await authService.getUserByEmail('unknown@test.com')

            expect(result).toBeNull()
        })
    })

    describe('getUserByIdentifier', () => {
        it('should look up by MSSV first', async () => {
            const mockStudent = { id: '1', studentCode: '102210001', fullName: 'Test' }
            ;(authRepository.getUserByMssv as jest.Mock).mockResolvedValue(mockStudent)

            const result = await authService.getUserByIdentifier('102210001')

            expect(authRepository.getUserByMssv).toHaveBeenCalledWith('102210001')
            expect(result).toEqual(mockStudent)
        })
    })

    describe('changePassword', () => {
        const mockUser = {
            id: '1',
            password: '$argon2id$v=19$m=65536,t=3,p=4$hashedpassword',
        }

        it('should throw if user not found', async () => {
            ;(authRepository.getUserById as jest.Mock).mockResolvedValue(null)

            await expect(
                authService.changePassword('1', 'SINHVIEN', {
                    oldPassword: 'old12345',
                    newPassword: 'new12345',
                    newPasswordConfirm: 'new12345',
                })
            ).rejects.toMatchObject({
                statusCode: HttpStatus.NOT_FOUND,
            })
        })
    })

    describe('createSession', () => {
        it('should create session for student user', async () => {
            const mockStudent = { id: '1', facultyId: '1', studentCode: '102210001' }
            ;(authRepository.getUserByPrincipal as jest.Mock).mockResolvedValue(mockStudent)
            ;(authRepository.createRefreshToken as jest.Mock).mockResolvedValue({})

            const result = await authService.createSession('1', 'SINHVIEN')

            expect(result).toHaveProperty('accessToken', 'mock-access-token')
            expect(result).toHaveProperty('refreshToken', 'mock-refresh-token')
            expect(authRepository.createRefreshToken).toHaveBeenCalled()
        })
    })
})
