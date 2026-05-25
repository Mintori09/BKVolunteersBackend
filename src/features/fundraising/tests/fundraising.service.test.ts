import { HttpStatus } from 'src/common/constants'
import * as fundraisingRepository from '../fundraising.repository'
import * as fundraisingService from '../fundraising.service'

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

jest.mock('../fundraising.repository')

describe('fundraising.service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        delete process.env.SEPAY_WEBHOOK_SECRET
    })

    describe('createDonation', () => {
        it('should reject non-student principal', async () => {
            await expect(
                fundraisingService.createDonation(
                    '11',
                    { amount: 100000 },
                    { accountType: 'OPERATOR', userId: '7' }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.FORBIDDEN,
            })
        })

        it('should create pending donation for student', async () => {
            ;(fundraisingRepository.findModuleBaseById as jest.Mock).mockResolvedValue({
                id: 11n,
                campaignId: 7n,
                type: 'FUNDRAISING',
                status: 'OPEN',
                startAt: new Date('2025-01-01T00:00:00.000Z'),
                endAt: new Date('2027-01-01T00:00:00.000Z'),
                settingsJson: {
                    receiver_name: 'CLB ITV',
                    bank_name: 'VCB',
                    bank_account_no: '123456',
                    currency: 'VND',
                },
                campaign: {
                    status: 'ONGOING',
                    organizationId: 5n,
                },
            })
            ;(fundraisingRepository.createDonation as jest.Mock).mockResolvedValue({
                id: 51n,
                campaignId: 7n,
                moduleId: 11n,
                studentId: 42n,
                donorName: 'Sinh vien an danh',
                amount: 100000,
                message: null,
                evidenceUrl: null,
                status: 'PENDING',
                matchedTransactionId: null,
                verifiedBy: null,
                verifiedAt: null,
                rejectReason: null,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
            })

            const result = await fundraisingService.createDonation(
                '11',
                { amount: 100000 },
                { accountType: 'STUDENT', userId: '42' }
            )

            expect(fundraisingRepository.createDonation).toHaveBeenCalledWith({
                campaignId: 7n,
                moduleId: 11n,
                studentId: 42n,
                donorName: 'Sinh viên ẩn danh',
                amount: 100000,
                message: null,
                evidenceUrl: null,
            })
            expect(result).toMatchObject({
                id: 51,
                status: 'PENDING',
                student_id: 42,
                payment_instruction: {
                    receiver_name: 'CLB ITV',
                    bank_name: 'VCB',
                    bank_account_no: '123456',
                    amount: 100000,
                    currency: 'VND',
                },
            })
        })

        it('should accept lowercase fundraising module type from seeded fixtures', async () => {
            ;(fundraisingRepository.findModuleBaseById as jest.Mock).mockResolvedValue({
                id: 11n,
                campaignId: 7n,
                type: 'fundraising',
                status: 'OPEN',
                startAt: new Date('2025-01-01T00:00:00.000Z'),
                endAt: new Date('2027-01-01T00:00:00.000Z'),
                settingsJson: {
                    receiver_name: 'CLB ITV',
                    bank_name: 'VCB',
                    bank_account_no: '123456',
                    currency: 'VND',
                },
                campaign: {
                    status: 'ONGOING',
                    organizationId: 5n,
                },
            })
            ;(fundraisingRepository.createDonation as jest.Mock).mockResolvedValue({
                id: 52n,
                campaignId: 7n,
                moduleId: 11n,
                studentId: 42n,
                donorName: 'Sinh viên ẩn danh',
                amount: 150000,
                message: null,
                evidenceUrl: null,
                status: 'PENDING',
                matchedTransactionId: null,
                verifiedBy: null,
                verifiedAt: null,
                rejectReason: null,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
            })

            const result = await fundraisingService.createDonation(
                '11',
                { amount: 150000 },
                { accountType: 'STUDENT', userId: '42' }
            )

            expect(result).toMatchObject({
                id: 52,
                status: 'PENDING',
                payment_instruction: {
                    receiver_name: 'CLB ITV',
                },
            })
        })

        it('should reject when fundraising module is closed', async () => {
            ;(fundraisingRepository.findModuleBaseById as jest.Mock).mockResolvedValue({
                id: 11n,
                campaignId: 7n,
                type: 'FUNDRAISING',
                status: 'CLOSED',
                startAt: new Date('2025-01-01T00:00:00.000Z'),
                endAt: new Date('2027-01-01T00:00:00.000Z'),
                settingsJson: {},
                campaign: {
                    status: 'ONGOING',
                    organizationId: 5n,
                },
            })

            await expect(
                fundraisingService.createDonation(
                    '11',
                    { amount: 100000 },
                    { accountType: 'STUDENT', userId: '42' }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })
        })
    })

    describe('updateModuleConfig', () => {
        it('should accept flat config payload and return normalized config', async () => {
            ;(fundraisingRepository.findModuleBaseById as jest.Mock).mockResolvedValue({
                id: 11n,
                type: 'FUNDRAISING',
                settingsJson: { currency: 'VND' },
                campaign: {
                    organizationId: 5n,
                },
            })
            ;(fundraisingRepository.updateModuleConfig as jest.Mock).mockResolvedValue({
                id: 11n,
                settingsJson: {
                    target_amount: 5000000,
                    receiver_name: 'CLB ITV',
                    bank_name: 'VCB',
                    bank_account_no: '123456',
                    currency: 'VND',
                    sepay_enabled: true,
                    sepay_account_id: 'sp-01',
                },
                status: 'OPEN',
            })

            const result = await fundraisingService.updateModuleConfig(
                '11',
                {
                    target_amount: 5000000,
                    receiver_name: 'CLB ITV',
                    bank_name: 'VCB',
                    bank_account_no: '123456',
                    currency: 'VND',
                    sepay_enabled: true,
                    sepay_account_id: 'sp-01',
                    status: 'OPEN',
                },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    role: 'CLB',
                    organizationId: '5',
                }
            )

            expect(fundraisingRepository.updateModuleConfig).toHaveBeenCalledWith({
                moduleId: 11n,
                settingsJson: {
                    target_amount: 5000000,
                    receiver_name: 'CLB ITV',
                    bank_name: 'VCB',
                    bank_account_no: '123456',
                    currency: 'VND',
                    sepay_enabled: true,
                    sepay_account_id: 'sp-01',
                },
                status: 'OPEN',
            })
            expect(result).toEqual({
                module_id: 11,
                config: {
                    target_amount: 5000000,
                    receiver_name: 'CLB ITV',
                    bank_name: 'VCB',
                    bank_account_no: '123456',
                    currency: 'VND',
                    sepay_enabled: true,
                    sepay_account_id: 'sp-01',
                },
                status: 'OPEN',
            })
        })
    })

    describe('verifyDonation', () => {
        it('should reject non-pending donation', async () => {
            ;(fundraisingRepository.findDonationById as jest.Mock).mockResolvedValue({
                id: 51n,
                status: 'VERIFIED',
                module: {
                    campaign: {
                        organizationId: 5n,
                    },
                },
            })

            await expect(
                fundraisingService.verifyDonation(
                    '51',
                    {},
                    {
                        accountType: 'OPERATOR',
                        userId: '9',
                        role: 'CLB',
                        organizationId: '5',
                    }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.CONFLICT,
            })
        })

        it('should update donation and create audit log', async () => {
            const now = new Date('2025-01-02T00:00:00.000Z')
            ;(fundraisingRepository.findDonationById as jest.Mock).mockResolvedValue({
                id: 51n,
                campaignId: 7n,
                moduleId: 11n,
                studentId: 42n,
                donorName: 'Nguyen Van A',
                amount: 100000,
                message: null,
                evidenceUrl: null,
                status: 'PENDING',
                matchedTransactionId: null,
                verifiedBy: null,
                verifiedAt: null,
                rejectReason: null,
                createdAt: now,
                updatedAt: now,
                module: {
                    campaign: {
                        organizationId: 5n,
                    },
                },
            })
            ;(fundraisingRepository.updateDonationDecision as jest.Mock).mockResolvedValue({
                id: 51n,
                campaignId: 7n,
                moduleId: 11n,
                studentId: 42n,
                donorName: 'Nguyen Van A',
                amount: 100000,
                message: null,
                evidenceUrl: null,
                status: 'VERIFIED',
                matchedTransactionId: null,
                verifiedBy: 9n,
                verifiedAt: now,
                rejectReason: null,
                createdAt: now,
                updatedAt: now,
            })
            ;(fundraisingRepository.createAuditLog as jest.Mock).mockResolvedValue({})

            const result = await fundraisingService.verifyDonation(
                '51',
                { reason: 'ok' },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    role: 'CLB',
                    organizationId: '5',
                }
            )

            expect(fundraisingRepository.updateDonationDecision).toHaveBeenCalledWith({
                id: 51n,
                userId: 9n,
                status: 'VERIFIED',
                rejectReason: null,
            })
            expect(fundraisingRepository.createAuditLog).toHaveBeenCalled()
            expect(result).toMatchObject({
                id: 51,
                status: 'VERIFIED',
                verified_by: 9,
            })
        })

        it('should reject operator from another organization', async () => {
            ;(fundraisingRepository.findDonationById as jest.Mock).mockResolvedValue({
                id: 51n,
                status: 'PENDING',
                module: {
                    campaign: {
                        organizationId: 5n,
                    },
                },
            })

            await expect(
                fundraisingService.verifyDonation(
                    '51',
                    {},
                    {
                        accountType: 'OPERATOR',
                        userId: '9',
                        role: 'CLB',
                        organizationId: '99',
                    }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.FORBIDDEN,
            })
        })

        it('should verify matched donation with aligned transaction context', async () => {
            const now = new Date('2025-01-02T00:00:00.000Z')
            ;(fundraisingRepository.findDonationById as jest.Mock).mockResolvedValue({
                id: 51n,
                campaignId: 7n,
                moduleId: 11n,
                studentId: 42n,
                donorName: 'Nguyen Van A',
                amount: 100000,
                message: null,
                evidenceUrl: null,
                status: 'MATCHED',
                matchedTransactionId: 88n,
                verifiedBy: null,
                verifiedAt: null,
                rejectReason: null,
                createdAt: now,
                updatedAt: now,
                module: {
                    campaign: {
                        organizationId: 5n,
                    },
                },
            })
            ;(
                fundraisingRepository.findPaymentTransactionById as jest.Mock
            ).mockResolvedValue({
                id: 88n,
                matchStatus: 'MATCHED',
                matchedDonationId: 51n,
            })
            ;(fundraisingRepository.updateDonationDecision as jest.Mock).mockResolvedValue({
                id: 51n,
                campaignId: 7n,
                moduleId: 11n,
                studentId: 42n,
                donorName: 'Nguyen Van A',
                amount: 100000,
                message: null,
                evidenceUrl: null,
                status: 'VERIFIED',
                matchedTransactionId: 88n,
                verifiedBy: 9n,
                verifiedAt: now,
                rejectReason: null,
                createdAt: now,
                updatedAt: now,
            })
            ;(fundraisingRepository.createAuditLog as jest.Mock).mockResolvedValue({})

            const result = await fundraisingService.verifyDonation(
                '51',
                { transaction_id: '88', note: 'doi soat tay' },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    role: 'CLB',
                    organizationId: '5',
                }
            )

            expect(
                fundraisingRepository.findPaymentTransactionById
            ).toHaveBeenCalledWith(88n)
            expect(result).toMatchObject({
                id: 51,
                status: 'VERIFIED',
                matched_transaction_id: 88,
            })
        })
    })

    describe('transaction reconciliation', () => {
        it('should list transactions in operator scope', async () => {
            ;(fundraisingRepository.findPaymentTransactions as jest.Mock).mockResolvedValue([
                [
                    {
                        id: 88n,
                        provider: 'SEPAY',
                        providerTransactionId: 'tx_1',
                        campaignId: 7n,
                        moduleId: 11n,
                        amount: 100000,
                        content: 'ung ho',
                        accountNo: '123456',
                        transactionTime: new Date('2025-01-01T00:00:00.000Z'),
                        matchStatus: 'UNMATCHED',
                        matchedDonationId: null,
                        createdAt: new Date('2025-01-01T00:00:00.000Z'),
                        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                        matchedDonation: null,
                    },
                ],
                1,
            ])

            const result = await fundraisingService.listTransactions(
                { module_id: '11', match_status: 'UNMATCHED', page: 1, limit: 20 },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    role: 'CLB',
                    organizationId: '5',
                }
            )

            expect(fundraisingRepository.findPaymentTransactions).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        moduleId: 11n,
                        matchStatus: 'UNMATCHED',
                    }),
                })
            )
            expect(result.items[0]).toMatchObject({
                id: 88,
                provider_transaction_id: 'tx_1',
                match_status: 'UNMATCHED',
            })
        })

        it('should combine organization scope and free-text search with AND', async () => {
            ;(fundraisingRepository.findPaymentTransactions as jest.Mock).mockResolvedValue([
                [],
                0,
            ])

            await fundraisingService.listTransactions(
                {
                    q: 'tx_1',
                    page: 1,
                    limit: 20,
                },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    role: 'CLB',
                    organizationId: '5',
                }
            )

            expect(
                fundraisingRepository.findPaymentTransactions
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        AND: [
                            {
                                OR: [
                                    { content: { contains: 'tx_1' } },
                                    { providerTransactionId: { contains: 'tx_1' } },
                                    { accountNo: { contains: 'tx_1' } },
                                ],
                            },
                            {
                                OR: [
                                    {
                                        module: {
                                            campaign: { organizationId: 5n },
                                        },
                                    },
                                    { campaign: { organizationId: 5n } },
                                ],
                            },
                        ],
                    }),
                })
            )
        })

        it('should attach unmatched transaction to pending donation', async () => {
            ;(
                fundraisingRepository.findPaymentTransactionById as jest.Mock
            ).mockResolvedValue({
                id: 88n,
                campaignId: 7n,
                moduleId: 11n,
                matchStatus: 'UNMATCHED',
                matchedDonationId: null,
                module: {
                    campaign: {
                        organizationId: 5n,
                    },
                },
                campaign: null,
                matchedDonation: null,
            })
            ;(fundraisingRepository.findDonationById as jest.Mock).mockResolvedValue({
                id: 51n,
                moduleId: 11n,
                status: 'PENDING',
                matchedTransactionId: null,
                module: {
                    campaign: {
                        organizationId: 5n,
                    },
                },
            })
            ;(
                fundraisingRepository.updatePaymentTransactionMatch as jest.Mock
            ).mockResolvedValue({
                id: 88n,
                provider: 'SEPAY',
                providerTransactionId: 'tx_1',
                campaignId: 7n,
                moduleId: 11n,
                amount: 100000,
                content: null,
                accountNo: null,
                transactionTime: new Date('2025-01-01T00:00:00.000Z'),
                matchStatus: 'MATCHED',
                matchedDonationId: 51n,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                matchedDonation: null,
            })
            ;(fundraisingRepository.attachDonationMatch as jest.Mock).mockResolvedValue({})

            const result = await fundraisingService.attachTransactionToDonation(
                '88',
                { donation_id: '51' },
                {
                    accountType: 'OPERATOR',
                    userId: '9',
                    role: 'CLB',
                    organizationId: '5',
                }
            )

            expect(fundraisingRepository.attachDonationMatch).toHaveBeenCalledWith({
                donationId: 51n,
                transactionId: 88n,
            })
            expect(result).toMatchObject({
                id: 88,
                match_status: 'MATCHED',
                matched_donation_id: 51,
            })
        })

        it('should unmatch transaction and revert donation to pending', async () => {
            ;(
                fundraisingRepository.findPaymentTransactionById as jest.Mock
            ).mockResolvedValue({
                id: 88n,
                campaignId: 7n,
                moduleId: 11n,
                matchStatus: 'MATCHED',
                matchedDonationId: 51n,
                module: {
                    campaign: {
                        organizationId: 5n,
                    },
                },
                campaign: null,
                matchedDonation: {
                    id: 51n,
                    donorName: 'Nguyen Van A',
                    amount: 100000,
                    status: 'MATCHED',
                    createdAt: new Date('2025-01-01T00:00:00.000Z'),
                },
            })
            ;(
                fundraisingRepository.updatePaymentTransactionMatch as jest.Mock
            ).mockResolvedValue({
                id: 88n,
                provider: 'SEPAY',
                providerTransactionId: 'tx_1',
                campaignId: 7n,
                moduleId: 11n,
                amount: 100000,
                content: null,
                accountNo: null,
                transactionTime: new Date('2025-01-01T00:00:00.000Z'),
                matchStatus: 'UNMATCHED',
                matchedDonationId: null,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
                matchedDonation: null,
            })
            ;(fundraisingRepository.clearDonationMatch as jest.Mock).mockResolvedValue({})

            const result = await fundraisingService.unmatchTransaction('88', {
                accountType: 'OPERATOR',
                userId: '9',
                role: 'CLB',
                organizationId: '5',
            })

            expect(fundraisingRepository.clearDonationMatch).toHaveBeenCalledWith({
                donationId: 51n,
                status: 'PENDING',
            })
            expect(result).toMatchObject({
                id: 88,
                match_status: 'UNMATCHED',
                matched_donation_id: null,
            })
        })
    })

    describe('handleSepayWebhook', () => {
        it('should reject invalid webhook secret when configured', async () => {
            process.env.SEPAY_WEBHOOK_SECRET = 'expected-secret'

            await expect(
                fundraisingService.handleSepayWebhook(
                    { transaction_id: 'tx_1', amount: 1000 },
                    { secret: 'wrong-secret' }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.FORBIDDEN,
            })
        })

        it('should mark unmatched transaction without auto-verifying donation', async () => {
            ;(fundraisingRepository.upsertPaymentTransaction as jest.Mock).mockResolvedValue({
                id: 88n,
            })
            ;(fundraisingRepository.findPendingDonationMatch as jest.Mock).mockResolvedValue(
                null
            )
            ;(
                fundraisingRepository.updatePaymentTransactionMatch as jest.Mock
            ).mockResolvedValue({
                id: 88n,
                matchStatus: 'UNMATCHED',
                matchedDonationId: null,
            })

            const result = await fundraisingService.handleSepayWebhook(
                {
                    transaction_id: 'tx_1',
                    amount: 1000,
                    module_id: '11',
                    campaign_id: '7',
                },
                {}
            )

            expect(fundraisingRepository.attachDonationMatch).not.toHaveBeenCalled()
            expect(result).toEqual({
                accepted: true,
                transaction_id: 88,
                match_status: 'UNMATCHED',
                matched_donation_id: null,
                raw_payload: {
                    transaction_id: 'tx_1',
                    amount: 1000,
                    module_id: '11',
                    campaign_id: '7',
                },
            })
        })

        it('should mark donation as matched when webhook finds pending donation', async () => {
            ;(fundraisingRepository.upsertPaymentTransaction as jest.Mock).mockResolvedValue({
                id: 88n,
            })
            ;(fundraisingRepository.findPendingDonationMatch as jest.Mock).mockResolvedValue({
                id: 51n,
            })
            ;(
                fundraisingRepository.updatePaymentTransactionMatch as jest.Mock
            ).mockResolvedValue({
                id: 88n,
                matchStatus: 'MATCHED',
                matchedDonationId: 51n,
            })
            ;(fundraisingRepository.attachDonationMatch as jest.Mock).mockResolvedValue({})

            const result = await fundraisingService.handleSepayWebhook(
                {
                    transaction_id: 'tx_1',
                    amount: 1000,
                    module_id: '11',
                    campaign_id: '7',
                },
                {}
            )

            expect(fundraisingRepository.attachDonationMatch).toHaveBeenCalledWith({
                donationId: 51n,
                transactionId: 88n,
            })
            expect(result).toEqual({
                accepted: true,
                transaction_id: 88,
                match_status: 'MATCHED',
                matched_donation_id: 51,
                raw_payload: {
                    transaction_id: 'tx_1',
                    amount: 1000,
                    module_id: '11',
                    campaign_id: '7',
                },
            })
        })
    })
})
