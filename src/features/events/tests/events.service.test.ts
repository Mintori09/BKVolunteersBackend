import { HttpStatus } from 'src/common/constants'
import * as eventsRepository from '../events.repository'
import * as eventsService from '../events.service'

jest.mock('src/config', () => ({
    prismaClient: {},
    config: {
        node_env: 'test',
        email: {
            smtp: {
                host: 'localhost',
                port: '1025',
                auth: {
                    username: 'test_user',
                    password: 'test_password',
                },
            },
        },
    },
}))

jest.mock('../events.repository')

describe('events.service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('registerEvent', () => {
        it('should reject non-student principal', async () => {
            await expect(
                eventsService.registerEvent(
                    '11',
                    {},
                    { accountType: 'OPERATOR', userId: '9' }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.FORBIDDEN,
            })
        })

        it('should reject missing module', async () => {
            ;(eventsRepository.findModuleBaseById as jest.Mock).mockResolvedValue(
                null
            )

            await expect(
                eventsService.registerEvent(
                    '11',
                    {},
                    { accountType: 'STUDENT', userId: '42' }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.NOT_FOUND,
            })
        })

        it('should upsert pending registration for student', async () => {
            ;(eventsRepository.findModuleBaseById as jest.Mock).mockResolvedValue({
                id: 11n,
                campaignId: 7n,
                type: 'EVENT',
            })
            ;(eventsRepository.upsertRegistration as jest.Mock).mockResolvedValue({
                id: 101n,
                moduleId: 11n,
                status: 'PENDING',
            })

            const result = await eventsService.registerEvent(
                '11',
                { answers_json: { shirt_size: 'M' } },
                { accountType: 'STUDENT', userId: '42' }
            )

            expect(eventsRepository.upsertRegistration).toHaveBeenCalledWith({
                moduleId: 11n,
                campaignId: 7n,
                studentId: 42n,
                answersJson: { shirt_size: 'M' },
            })
            expect(result).toEqual({
                id: 101,
                status: 'PENDING',
                module_id: 11,
            })
        })
    })

    describe('approveEventRegistration', () => {
        it('should reject non-operator principal', async () => {
            await expect(
                eventsService.approveEventRegistration(
                    '101',
                    {},
                    { accountType: 'STUDENT', userId: '42' }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.FORBIDDEN,
            })
        })

        it('should approve registration with operator reviewer', async () => {
            ;(eventsRepository.approveRegistration as jest.Mock).mockResolvedValue({
                id: 101n,
                status: 'APPROVED',
            })

            const result = await eventsService.approveEventRegistration(
                '101',
                { note: 'Dat yeu cau' },
                { accountType: 'OPERATOR', userId: '9' }
            )

            expect(eventsRepository.approveRegistration).toHaveBeenCalledWith({
                id: 101n,
                reviewedBy: 9n,
                note: 'Dat yeu cau',
            })
            expect(result).toEqual({
                id: 101,
                status: 'APPROVED',
            })
        })
    })
})
