import { HttpStatus } from 'src/common/constants'
import * as itemDonationsRepository from '../item-donations.repository'
import * as itemDonationsService from '../item-donations.service'
import * as notificationService from 'src/features/notification/notification.service'

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
jest.mock('src/features/notification/notification.service', () => ({
    createForStudent: jest.fn(),
}))

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
                status: 'OPEN',
                startAt: new Date('2026-05-01T00:00:00.000Z'),
                endAt: new Date('2026-06-01T00:00:00.000Z'),
                settingsJson: {},
                campaign: {
                    id: 7n,
                    status: 'ONGOING',
                    organizationId: 5n,
                },
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
                status: 'OPEN',
                startAt: new Date('2026-05-01T00:00:00.000Z'),
                endAt: new Date('2026-06-01T00:00:00.000Z'),
                settingsJson: {},
                campaign: {
                    id: 7n,
                    status: 'ONGOING',
                    organizationId: 5n,
                },
            })
            ;(itemDonationsRepository.findTarget as jest.Mock).mockResolvedValue({
                id: 8n,
                moduleId: 21n,
                campaignId: 7n,
                targetQuantity: 10,
                status: 'ACTIVE',
            })
            ;(
                itemDonationsRepository.sumReservedQuantityByTarget as jest.Mock
            ).mockResolvedValue(2)
            ;(itemDonationsRepository.createPledge as jest.Mock).mockResolvedValue({
                id: 300n,
                status: 'PLEDGED',
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
                expectedHandoverAt: null,
            })
            expect(result).toEqual({
                id: 300,
                status: 'PLEDGED',
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
            ;(itemDonationsRepository.findPledgeById as jest.Mock).mockResolvedValue({
                id: 300n,
                status: 'PLEDGED',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 21n,
                },
                itemTarget: {
                    name: 'Sach',
                },
                student: {
                    id: 42n,
                },
            })
            ;(itemDonationsRepository.confirmPledge as jest.Mock).mockResolvedValue({
                id: 300n,
                status: 'CONFIRMED',
            })

            const result = await itemDonationsService.confirmPledge('300', {
                accountType: 'OPERATOR',
                userId: '9',
                organizationId: '5',
                role: 'CLB',
            })

            expect(itemDonationsRepository.confirmPledge).toHaveBeenCalledWith(
                300n
            )
            expect(result).toEqual({
                id: 300,
                status: 'CONFIRMED',
            })
            expect(notificationService.createForStudent).toHaveBeenCalledWith({
                studentId: '42',
                type: 'ITEM_PLEDGE_CONFIRMED',
                title: 'Pledge hiện vật đã được xác nhận',
                message: 'Đăng ký Sach của bạn đã được xác nhận.',
                dataJson: {
                    pledge_id: 300,
                    campaign_id: 7,
                    module_id: 21,
                },
            })
        })

        it('should reject confirm when pledge status is not pending', async () => {
            ;(itemDonationsRepository.findPledgeById as jest.Mock).mockResolvedValue({
                id: 300n,
                status: 'CONFIRMED',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 21n,
                },
                itemTarget: {
                    name: 'Sach',
                },
                student: {
                    id: 42n,
                },
            })

            await expect(
                itemDonationsService.confirmPledge('300', {
                    accountType: 'OPERATOR',
                    userId: '9',
                    organizationId: '5',
                    role: 'CLB',
                })
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })
        })
    })

    describe('rejectPledge', () => {
        it('should reject pledge and notify student', async () => {
            ;(itemDonationsRepository.findPledgeById as jest.Mock).mockResolvedValue({
                id: 301n,
                status: 'PLEDGED',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 21n,
                },
                itemTarget: {
                    name: 'Ao am',
                },
                student: {
                    id: 44n,
                },
            })
            ;(itemDonationsRepository.rejectPledge as jest.Mock).mockResolvedValue({
                id: 301n,
                status: 'REJECTED',
            })

            const result = await itemDonationsService.rejectPledge(
                '301',
                { reason: 'Nhu cầu đã đủ số lượng' },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    organizationId: '5',
                    role: 'CLB',
                }
            )

            expect(itemDonationsRepository.rejectPledge).toHaveBeenCalledWith({
                id: 301n,
                reason: 'Nhu cầu đã đủ số lượng',
            })
            expect(result).toEqual({
                id: 301,
                status: 'REJECTED',
            })
            expect(notificationService.createForStudent).toHaveBeenCalledWith({
                studentId: '44',
                type: 'ITEM_PLEDGE_REJECTED',
                title: 'Pledge hiện vật bị từ chối',
                message: 'Nhu cầu đã đủ số lượng',
                dataJson: {
                    pledge_id: 301,
                    campaign_id: 7,
                    module_id: 21,
                },
            })
        })

        it('should reject reject transition for confirmed pledge', async () => {
            ;(itemDonationsRepository.findPledgeById as jest.Mock).mockResolvedValue({
                id: 301n,
                status: 'CONFIRMED',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 21n,
                },
                itemTarget: {
                    name: 'Ao am',
                },
                student: {
                    id: 44n,
                },
            })

            await expect(
                itemDonationsService.rejectPledge(
                    '301',
                    { reason: 'Không hợp lệ' },
                    {
                        accountType: 'OPERATOR',
                        userId: '9',
                        organizationId: '5',
                        role: 'CLB',
                    }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })
        })
    })

    describe('handoverPledge', () => {
        it('should reject handover when pledge is not confirmed', async () => {
            ;(itemDonationsRepository.findPledgeById as jest.Mock).mockResolvedValue({
                id: 302n,
                quantity: 3,
                status: 'PLEDGED',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 21n,
                    settingsJson: {
                        allow_over_target: false,
                    },
                },
                itemTarget: {
                    id: 8n,
                    name: 'Sach',
                    unit: 'quyen',
                    targetQuantity: 10,
                    receivedQuantity: 2,
                },
                student: {
                    id: 42n,
                },
            })

            await expect(
                itemDonationsService.handoverPledge(
                    '302',
                    { received_quantity: 2 },
                    {
                        accountType: 'OPERATOR',
                        userId: '9',
                        organizationId: '5',
                        role: 'CLB',
                    }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })
        })

        it('should reject handover above pledged quantity', async () => {
            ;(itemDonationsRepository.findPledgeById as jest.Mock).mockResolvedValue({
                id: 302n,
                quantity: 3,
                status: 'CONFIRMED',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 21n,
                    settingsJson: {
                        allow_over_target: false,
                    },
                },
                itemTarget: {
                    id: 8n,
                    name: 'Sach',
                    unit: 'quyen',
                    targetQuantity: 10,
                    receivedQuantity: 2,
                },
                student: {
                    id: 42n,
                },
            })

            await expect(
                itemDonationsService.handoverPledge(
                    '302',
                    { received_quantity: 4 },
                    {
                        accountType: 'OPERATOR',
                        userId: '9',
                        organizationId: '5',
                        role: 'CLB',
                    }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })
        })

        it('should reject handover above target when over-target is disabled', async () => {
            ;(itemDonationsRepository.findPledgeById as jest.Mock).mockResolvedValue({
                id: 302n,
                quantity: 3,
                status: 'CONFIRMED',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 21n,
                    settingsJson: {
                        allow_over_target: false,
                    },
                },
                itemTarget: {
                    id: 8n,
                    name: 'Sach',
                    unit: 'quyen',
                    targetQuantity: 4,
                    receivedQuantity: 3,
                },
                student: {
                    id: 42n,
                },
            })

            await expect(
                itemDonationsService.handoverPledge(
                    '302',
                    { received_quantity: 2 },
                    {
                        accountType: 'OPERATOR',
                        userId: '9',
                        organizationId: '5',
                        role: 'CLB',
                    }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })
        })

        it('should hand over confirmed pledge and notify student', async () => {
            const receivedAt = new Date('2026-05-20T08:30:00.000Z')
            ;(itemDonationsRepository.findPledgeById as jest.Mock).mockResolvedValue({
                id: 302n,
                quantity: 3,
                status: 'CONFIRMED',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 21n,
                    settingsJson: {
                        allow_over_target: false,
                    },
                },
                itemTarget: {
                    id: 8n,
                    name: 'Sach',
                    unit: 'quyen',
                    targetQuantity: 10,
                    receivedQuantity: 2,
                },
                student: {
                    id: 42n,
                },
            })
            ;(itemDonationsRepository.handoverPledge as jest.Mock).mockResolvedValue({
                id: 302n,
                status: 'RECEIVED',
                receivedAt,
            })

            const result = await itemDonationsService.handoverPledge(
                '302',
                {
                    received_quantity: 3,
                    received_at: receivedAt.toISOString(),
                    note: 'Da nhan tai van phong',
                },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    organizationId: '5',
                    role: 'CLB',
                }
            )

            expect(itemDonationsRepository.handoverPledge).toHaveBeenCalledWith({
                id: 302n,
                receivedQuantity: 3,
                receivedAt,
                evidenceUrl: null,
                handoverNote: 'Da nhan tai van phong',
            })
            expect(result).toEqual({
                pledge_id: 302,
                handover_id: `302-${receivedAt.getTime()}`,
                status: 'RECEIVED',
            })
            expect(notificationService.createForStudent).toHaveBeenCalledWith({
                studentId: '42',
                type: 'ITEM_PLEDGE_RECEIVED',
                title: 'Đã ghi nhận bàn giao hiện vật',
                message: 'Đơn vị đã ghi nhận 3 quyen Sach.',
                dataJson: {
                    pledge_id: 302,
                    campaign_id: 7,
                    module_id: 21,
                    received_quantity: 3,
                },
            })
        })
    })

    describe('pledge journey', () => {
        it('should cover pledge -> confirm -> handover flow with state changes', async () => {
            ;(
                itemDonationsRepository.findModuleWithCampaign as jest.Mock
            ).mockResolvedValue({
                id: 21n,
                campaignId: 7n,
                type: 'ITEM_DONATION',
                status: 'OPEN',
                startAt: new Date('2026-05-01T00:00:00.000Z'),
                endAt: new Date('2026-06-01T00:00:00.000Z'),
                settingsJson: {
                    allow_over_target: false,
                },
                campaign: {
                    id: 7n,
                    status: 'ONGOING',
                    organizationId: 5n,
                },
            })
            ;(itemDonationsRepository.findTarget as jest.Mock).mockResolvedValue({
                id: 8n,
                moduleId: 21n,
                campaignId: 7n,
                targetQuantity: 10,
                status: 'ACTIVE',
            })
            ;(
                itemDonationsRepository.sumReservedQuantityByTarget as jest.Mock
            ).mockResolvedValue(1)
            ;(itemDonationsRepository.createPledge as jest.Mock).mockResolvedValue({
                id: 400n,
                status: 'PLEDGED',
                quantity: 2,
                itemTargetId: 8n,
            })

            const created = await itemDonationsService.createPledge(
                '21',
                { item_target_id: '8', quantity: 2, donor_name: 'Nguyen Van A' },
                { accountType: 'STUDENT', userId: '42' }
            )

            expect(created).toEqual({
                id: 400,
                status: 'PLEDGED',
                quantity: 2,
                item_target_id: 8,
            })

            ;(itemDonationsRepository.findPledgeById as jest.Mock).mockResolvedValueOnce({
                id: 400n,
                quantity: 2,
                status: 'PLEDGED',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 21n,
                    settingsJson: {
                        allow_over_target: false,
                    },
                },
                itemTarget: {
                    id: 8n,
                    name: 'Sach',
                    unit: 'quyen',
                    targetQuantity: 10,
                    receivedQuantity: 1,
                },
                student: {
                    id: 42n,
                },
            })
            ;(itemDonationsRepository.confirmPledge as jest.Mock).mockResolvedValue({
                id: 400n,
                status: 'CONFIRMED',
            })

            const confirmed = await itemDonationsService.confirmPledge('400', {
                accountType: 'OPERATOR',
                userId: '9',
                organizationId: '5',
                role: 'CLB',
            })

            expect(confirmed).toEqual({
                id: 400,
                status: 'CONFIRMED',
            })

            const receivedAt = new Date('2026-05-20T09:15:00.000Z')
            ;(itemDonationsRepository.findPledgeById as jest.Mock).mockResolvedValueOnce({
                id: 400n,
                quantity: 2,
                status: 'CONFIRMED',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 21n,
                    settingsJson: {
                        allow_over_target: false,
                    },
                },
                itemTarget: {
                    id: 8n,
                    name: 'Sach',
                    unit: 'quyen',
                    targetQuantity: 10,
                    receivedQuantity: 1,
                },
                student: {
                    id: 42n,
                },
            })
            ;(itemDonationsRepository.handoverPledge as jest.Mock).mockResolvedValue({
                id: 400n,
                status: 'RECEIVED',
                receivedAt,
            })

            const handedOver = await itemDonationsService.handoverPledge(
                '400',
                {
                    received_quantity: 2,
                    received_at: receivedAt.toISOString(),
                },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    organizationId: '5',
                    role: 'CLB',
                }
            )

            expect(handedOver).toEqual({
                pledge_id: 400,
                handover_id: `400-${receivedAt.getTime()}`,
                status: 'RECEIVED',
            })
            expect(notificationService.createForStudent).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    studentId: '42',
                    type: 'ITEM_PLEDGE_CONFIRMED',
                })
            )
            expect(notificationService.createForStudent).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    studentId: '42',
                    type: 'ITEM_PLEDGE_RECEIVED',
                })
            )
        })
    })

    describe('target CRUD', () => {
        it('should update target for operator in scope', async () => {
            ;(itemDonationsRepository.findTargetById as jest.Mock).mockResolvedValue({
                id: 8n,
                moduleId: 21n,
                campaignId: 7n,
                name: 'Sach',
                unit: 'quyen',
                targetQuantity: 10,
                receivedQuantity: 2,
                description: null,
                status: 'ACTIVE',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 21n,
                    campaignId: 7n,
                },
                _count: {
                    pledges: 1,
                },
            })
            ;(
                itemDonationsRepository.sumReservedQuantityByTarget as jest.Mock
            ).mockResolvedValue(4)
            ;(itemDonationsRepository.updateTarget as jest.Mock).mockResolvedValue({
                id: 8n,
                moduleId: 21n,
                campaignId: 7n,
                name: 'Sach giao khoa',
                unit: 'quyen',
                targetQuantity: 12,
                receivedQuantity: 2,
                description: 'cap nhat',
                status: 'CLOSED',
            })

            const result = await itemDonationsService.updateTarget(
                '8',
                {
                    name: 'Sach giao khoa',
                    unit: 'quyen',
                    target_quantity: 12,
                    description: 'cap nhat',
                    status: 'CLOSED',
                },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    organizationId: '5',
                    role: 'CLB',
                }
            )

            expect(itemDonationsRepository.updateTarget).toHaveBeenCalledWith({
                id: 8n,
                name: 'Sach giao khoa',
                unit: 'quyen',
                targetQuantity: 12,
                description: 'cap nhat',
                status: 'CLOSED',
            })
            expect(result).toMatchObject({
                id: 8,
                target_quantity: 12,
                status: 'CLOSED',
            })
        })

        it('should reject target quantity below reserved commitments', async () => {
            ;(itemDonationsRepository.findTargetById as jest.Mock).mockResolvedValue({
                id: 8n,
                moduleId: 21n,
                campaignId: 7n,
                name: 'Sach',
                unit: 'quyen',
                targetQuantity: 10,
                receivedQuantity: 2,
                description: null,
                status: 'ACTIVE',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 21n,
                    campaignId: 7n,
                },
                _count: {
                    pledges: 1,
                },
            })
            ;(
                itemDonationsRepository.sumReservedQuantityByTarget as jest.Mock
            ).mockResolvedValue(6)

            await expect(
                itemDonationsService.updateTarget(
                    '8',
                    {
                        name: 'Sach',
                        unit: 'quyen',
                        target_quantity: 5,
                        status: 'ACTIVE',
                    },
                    {
                        accountType: 'OPERATOR',
                        userId: '9',
                        organizationId: '5',
                        role: 'CLB',
                    }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })
        })

        it('should delete target when no pledge or received quantity exists', async () => {
            ;(itemDonationsRepository.findTargetById as jest.Mock).mockResolvedValue({
                id: 8n,
                moduleId: 21n,
                campaignId: 7n,
                name: 'Sach',
                unit: 'quyen',
                targetQuantity: 10,
                receivedQuantity: 0,
                description: null,
                status: 'ACTIVE',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 21n,
                    campaignId: 7n,
                },
                _count: {
                    pledges: 0,
                },
            })
            ;(itemDonationsRepository.deleteTarget as jest.Mock).mockResolvedValue({})

            await itemDonationsService.deleteTarget('8', {
                accountType: 'OPERATOR',
                userId: '9',
                organizationId: '5',
                role: 'CLB',
            })

            expect(itemDonationsRepository.deleteTarget).toHaveBeenCalledWith(8n)
        })

        it('should reject deleting target with existing pledges', async () => {
            ;(itemDonationsRepository.findTargetById as jest.Mock).mockResolvedValue({
                id: 8n,
                moduleId: 21n,
                campaignId: 7n,
                name: 'Sach',
                unit: 'quyen',
                targetQuantity: 10,
                receivedQuantity: 0,
                description: null,
                status: 'ACTIVE',
                campaign: {
                    id: 7n,
                    organizationId: 5n,
                },
                module: {
                    id: 21n,
                    campaignId: 7n,
                },
                _count: {
                    pledges: 2,
                },
            })

            await expect(
                itemDonationsService.deleteTarget('8', {
                    accountType: 'OPERATOR',
                    userId: '9',
                    organizationId: '5',
                    role: 'CLB',
                })
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })
        })
    })
})
