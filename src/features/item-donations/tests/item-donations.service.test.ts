import { HttpStatus } from 'src/common/constants'
import * as itemDonationsRepository from '../item-donations.repository'
import * as itemDonationsService from '../item-donations.service'

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

jest.mock('../item-donations.repository')

describe('item-donations.service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('createPledge', () => {
        it('should reject non-student principal', async () => {
            await expect(
                itemDonationsService.createPledge(
                    '21',
                    { item_target_id: '8', quantity: 2 },
                    { accountType: 'OPERATOR', userId: '9' }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.FORBIDDEN,
            })
        })

        it('should reject missing target', async () => {
            ;(
                itemDonationsRepository.findModuleWithCampaign as jest.Mock
            ).mockResolvedValue({
                id: 21n,
                campaignId: 7n,
                type: 'ITEM_DONATION',
            })
            ;(itemDonationsRepository.findTarget as jest.Mock).mockResolvedValue(
                null
            )

            await expect(
                itemDonationsService.createPledge(
                    '21',
                    { item_target_id: '8', quantity: 2 },
                    { accountType: 'STUDENT', userId: '42' }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.NOT_FOUND,
            })
        })

        it('should create pledge for student with default donor name', async () => {
            ;(
                itemDonationsRepository.findModuleWithCampaign as jest.Mock
            ).mockResolvedValue({
                id: 21n,
                campaignId: 7n,
                type: 'ITEM_DONATION',
            })
            ;(itemDonationsRepository.findTarget as jest.Mock).mockResolvedValue({
                id: 8n,
                moduleId: 21n,
                campaignId: 7n,
            })
            ;(itemDonationsRepository.createPledge as jest.Mock).mockResolvedValue({
                id: 300n,
                status: 'PENDING',
                quantity: 2,
                itemTargetId: 8n,
            })

            const result = await itemDonationsService.createPledge(
                '21',
                { item_target_id: '8', quantity: 2 },
                { accountType: 'STUDENT', userId: '42' }
            )

            expect(itemDonationsRepository.createPledge).toHaveBeenCalledWith({
                campaignId: 7n,
                moduleId: 21n,
                itemTargetId: 8n,
                studentId: 42n,
                donorName: 'Sinh viên ẩn danh',
                quantity: 2,
                note: null,
            })
            expect(result).toEqual({
                id: 300,
                status: 'PENDING',
                quantity: 2,
                item_target_id: 8,
            })
        })
    })

    describe('confirmPledge', () => {
        it('should reject non-operator principal', async () => {
            await expect(
                itemDonationsService.confirmPledge('300', {
                    accountType: 'STUDENT',
                })
            ).rejects.toMatchObject({
                statusCode: HttpStatus.FORBIDDEN,
            })
        })

        it('should confirm pledge for operator', async () => {
            ;(itemDonationsRepository.confirmPledge as jest.Mock).mockResolvedValue({
                id: 300n,
                status: 'CONFIRMED',
            })

            const result = await itemDonationsService.confirmPledge('300', {
                accountType: 'OPERATOR',
            })

            expect(itemDonationsRepository.confirmPledge).toHaveBeenCalledWith(
                300n
            )
            expect(result).toEqual({
                id: 300,
                status: 'CONFIRMED',
            })
        })
    })
})
