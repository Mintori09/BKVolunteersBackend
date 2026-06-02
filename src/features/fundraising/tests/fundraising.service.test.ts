import { HttpStatus } from 'src/common/constants'
import * as fundraisingRepository from '../fundraising.repository'
import * as fundraisingService from '../fundraising.service'
import * as sepayClient from '../sepay.client'
import crypto from 'crypto'

jest.mock('src/config', () => ({
    prismaClient: {},
    config: {
        node_env: 'test',
        sepay: {
            apiEnabled: true,
            apiToken: 'test-token',
            apiMode: 'sandbox',
            apiBaseUrl: 'https://userapi-sandbox.sepay.vn/v2',
            vaEnabled: true,
            orderVaEnabled: true,
        },
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
jest.mock('../sepay.client')

describe('fundraising.service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        delete process.env.SEPAY_WEBHOOK_SECRET
        process.env.SEPAY_API_ENABLED = 'true'
        process.env.SEPAY_API_TOKEN = 'test-token'
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
            ;(fundraisingRepository.updateDonationPaymentInfo as jest.Mock).mockResolvedValue(
                {}
            )

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
                paymentMode: 'TRANSFER_CODE',
                sepayBankAccountRefId: null,
                message: null,
                evidenceUrl: null,
            })
            expect(
                fundraisingRepository.updateDonationPaymentInfo
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 51n,
                    paymentCode: 'BKV-51',
                    paymentExpiresAt: expect.any(Date),
                })
            )
            expect(result).toMatchObject({
                id: 51,
                status: 'PENDING',
                student_id: 42,
                payment_code: 'BKV-51',
                payment_instruction: {
                    receiver_name: 'CLB ITV',
                    bank_name: 'VCB',
                    bank_account_no: '123456',
                    amount: 100000,
                    currency: 'VND',
                    payment_code: 'BKV-51',
                    transfer_content: 'BKV-51',
                    vietqr_url:
                        'https://img.vietqr.io/image/VCB-123456-compact.png?accountName=CLB%20ITV&amount=100000',
                },
            })
            expect(result.payment_instruction?.expires_at).toBeInstanceOf(Date)
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
            ;(fundraisingRepository.updateDonationPaymentInfo as jest.Mock).mockResolvedValue(
                {}
            )

            const result = await fundraisingService.createDonation(
                '11',
                { amount: 150000 },
                { accountType: 'STUDENT', userId: '42' }
            )

            expect(result).toMatchObject({
                id: 52,
                status: 'PENDING',
                payment_code: 'BKV-52',
                payment_instruction: {
                    receiver_name: 'CLB ITV',
                    payment_code: 'BKV-52',
                    transfer_content: 'BKV-52',
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

        it('should create order-based VA donation when module config enables ORDER_VA', async () => {
            ;(fundraisingRepository.findModuleBaseById as jest.Mock).mockResolvedValue({
                id: 11n,
                campaignId: 7n,
                type: 'FUNDRAISING',
                status: 'OPEN',
                startAt: new Date('2025-01-01T00:00:00.000Z'),
                endAt: new Date('2027-01-01T00:00:00.000Z'),
                settingsJson: {
                    receiver_name: 'CLB ITV',
                    bank_name: 'BIDV',
                    bank_account_no: '0000000001',
                    currency: 'VND',
                    sepay_enabled: true,
                    sepay_mode: 'ORDER_VA',
                    sepay_bank_account_id: 'acc_1',
                },
                campaign: {
                    status: 'ONGOING',
                    organizationId: 5n,
                },
            })
            ;(
                fundraisingRepository.findSepayBankAccountBySepayId as jest.Mock
            ).mockResolvedValue({
                id: 901n,
                sepayAccountId: 'acc_1',
                bankShortName: 'BIDV',
            })
            ;(fundraisingRepository.createDonation as jest.Mock).mockResolvedValue({
                id: 53n,
                campaignId: 7n,
                moduleId: 11n,
                studentId: 42n,
                donorName: 'Sinh viên ẩn danh',
                amount: 100000,
                status: 'PENDING',
                matchedTransactionId: null,
                verifiedBy: null,
                verifiedAt: null,
                rejectReason: null,
                createdAt: new Date('2025-01-01T00:00:00.000Z'),
                updatedAt: new Date('2025-01-01T00:00:00.000Z'),
            })
            ;(fundraisingRepository.updateDonationPaymentInfo as jest.Mock).mockResolvedValue(
                {}
            )
            ;(sepayClient.createOrder as jest.Mock).mockResolvedValue({
                data: {
                    id: 'ord_1',
                    order_code: 'BKV-53',
                    amount: 100000,
                    paid_amount: 0,
                    status: 'Pending',
                },
            })
            ;(sepayClient.createOrderVirtualAccount as jest.Mock).mockResolvedValue({
                data: {
                    id: 'va_1',
                    va_number: '990000053',
                    va_holder_name: 'Sinh viên ẩn danh',
                    expired_at: '2026-05-26T18:00:00.000Z',
                },
            })
            ;(fundraisingRepository.upsertSepayOrderPayment as jest.Mock)
                .mockResolvedValueOnce({
                    sepayOrderId: 'ord_1',
                    orderCode: 'BKV-53',
                    amount: 100000,
                    paidAmount: 0,
                    status: 'PENDING',
                    vaPrefix: null,
                    expiresAt: new Date('2026-05-26T18:00:00.000Z'),
                    payloadJson: {},
                })
                .mockResolvedValueOnce({
                    sepayOrderId: 'ord_1',
                    orderCode: 'BKV-53',
                    status: 'PENDING',
                    providerQrUrl:
                        'https://img.vietqr.io/image/BIDV-990000053-compact.png?accountName=Sinh%20vi%C3%AAn%20%E1%BA%A9n%20danh&amount=100000',
                })
            ;(fundraisingRepository.upsertSepayVirtualAccount as jest.Mock).mockResolvedValue({
                id: 801n,
                sepayVaId: 'va_1',
                vaNumber: '990000053',
                subHolderName: 'Sinh viên ẩn danh',
            })

            const result = await fundraisingService.createDonation(
                '11',
                { amount: 100000 },
                { accountType: 'STUDENT', userId: '42' }
            )

            expect(sepayClient.createOrder).toHaveBeenCalled()
            expect(result).toMatchObject({
                payment_mode: 'ORDER_VA',
                payment_instruction: {
                    sepay_order_id: 'ord_1',
                    virtual_account: {
                        va_number: '990000053',
                    },
                },
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
                    sepay_bank_account_id: 'acc_1',
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
                    sepay_bank_account_id: 'acc_1',
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
                    sepay_bank_account_id: 'acc_1',
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
                    sepay_bank_account_id: 'acc_1',
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

        it('should accept valid SePay HMAC-SHA256 signature', async () => {
            process.env.SEPAY_WEBHOOK_SECRET = 'expected-secret'
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

            const rawBody =
                '{"transaction_id":"tx_1","amount":1000,"module_id":"11","campaign_id":"7"}'
            const timestamp = Math.floor(Date.now() / 1000).toString()
            const signature = `sha256=${crypto
                .createHmac('sha256', 'expected-secret')
                .update(`${timestamp}.${rawBody}`)
                .digest('hex')}`

            const result = await fundraisingService.handleSepayWebhook(
                {
                    transaction_id: 'tx_1',
                    amount: 1000,
                    module_id: '11',
                    campaign_id: '7',
                },
                {
                    signature,
                    timestamp,
                    rawBody,
                }
            )

            expect(result).toMatchObject({
                accepted: true,
                transaction_id: 88,
                match_status: 'UNMATCHED',
            })
        })

        it('should reject invalid SePay HMAC-SHA256 signature', async () => {
            process.env.SEPAY_WEBHOOK_SECRET = 'expected-secret'

            await expect(
                fundraisingService.handleSepayWebhook(
                    { transaction_id: 'tx_1', amount: 1000 },
                    {
                        signature: 'sha256=invalid',
                        timestamp: Math.floor(Date.now() / 1000).toString(),
                        rawBody: '{"transaction_id":"tx_1","amount":1000}',
                    }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.FORBIDDEN,
            })
        })

        it('should reject stale SePay HMAC-SHA256 timestamp', async () => {
            process.env.SEPAY_WEBHOOK_SECRET = 'expected-secret'
            const rawBody = '{"transaction_id":"tx_1","amount":1000}'
            const timestamp = `${Math.floor(Date.now() / 1000) - 600}`
            const signature = `sha256=${crypto
                .createHmac('sha256', 'expected-secret')
                .update(`${timestamp}.${rawBody}`)
                .digest('hex')}`

            await expect(
                fundraisingService.handleSepayWebhook(
                    { transaction_id: 'tx_1', amount: 1000 },
                    {
                        signature,
                        timestamp,
                        rawBody,
                    }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.UNAUTHORIZED,
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

        it('should accept SePay dashboard camelCase payload and keep unmatched when module id is absent', async () => {
            ;(fundraisingRepository.upsertPaymentTransaction as jest.Mock).mockResolvedValue({
                id: 89n,
            })
            ;(fundraisingRepository.updatePaymentTransactionMatch as jest.Mock).mockResolvedValue({
                id: 89n,
                matchStatus: 'UNMATCHED',
                matchedDonationId: null,
            })

            const result = await fundraisingService.handleSepayWebhook(
                {
                    gateway: 'BIDV',
                    transactionDate: '2026-05-26 11:44:10',
                    accountNumber: '0000000001',
                    content: 'Giao dich thu nghiem 11h43m58s',
                    description: 'Giao dich thu nghiem 11h43m58s',
                    transferAmount: 100000,
                    referenceCode: 'SB9C79C3AABC1D',
                    id: 4159,
                },
                {}
            )

            expect(fundraisingRepository.upsertPaymentTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    providerTransactionId: '4159',
                    amount: 100000,
                    content: 'Giao dich thu nghiem 11h43m58s',
                    accountNo: '0000000001',
                })
            )
            expect(
                fundraisingRepository.findPendingDonationMatch
            ).not.toHaveBeenCalled()
            expect(result).toEqual({
                accepted: true,
                transaction_id: 89,
                match_status: 'UNMATCHED',
                matched_donation_id: null,
                raw_payload: {
                    gateway: 'BIDV',
                    transactionDate: '2026-05-26 11:44:10',
                    accountNumber: '0000000001',
                    content: 'Giao dich thu nghiem 11h43m58s',
                    description: 'Giao dich thu nghiem 11h43m58s',
                    transferAmount: 100000,
                    referenceCode: 'SB9C79C3AABC1D',
                    id: 4159,
                },
            })
        })

        it('should exact-match donation by payment code and backfill transaction context', async () => {
            ;(fundraisingRepository.upsertPaymentTransaction as jest.Mock).mockResolvedValue({
                id: 88n,
                content: 'Nap tien BKV-51',
            })
            ;(
                fundraisingRepository.findDonationByPaymentCode as jest.Mock
            ).mockResolvedValue({
                id: 51n,
                campaignId: 7n,
                moduleId: 11n,
                amount: 1000,
                status: 'PENDING',
                matchedTransactionId: null,
            })
            ;(
                fundraisingRepository.updatePaymentTransactionMatch as jest.Mock
            ).mockResolvedValue({
                id: 88n,
                matchStatus: 'MATCHED',
                matchedDonationId: 51n,
                campaignId: 7n,
                moduleId: 11n,
            })
            ;(fundraisingRepository.attachDonationMatch as jest.Mock).mockResolvedValue({})

            const result = await fundraisingService.handleSepayWebhook(
                {
                    transaction_id: 'tx_1',
                    amount: 1000,
                    content: 'Nap tien BKV-51',
                },
                {}
            )

            expect(
                fundraisingRepository.findDonationByPaymentCode
            ).toHaveBeenCalledWith('BKV-51')
            expect(
                fundraisingRepository.findPendingDonationMatch
            ).not.toHaveBeenCalled()
            expect(
                fundraisingRepository.updatePaymentTransactionMatch
            ).toHaveBeenCalledWith({
                id: 88n,
                matchStatus: 'MATCHED',
                matchedDonationId: 51n,
                campaignId: 7n,
                moduleId: 11n,
            })
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
                    content: 'Nap tien BKV-51',
                },
            })
        })

        it('should exact-match donation by SePay order code before payment code parsing', async () => {
            ;(fundraisingRepository.upsertPaymentTransaction as jest.Mock).mockResolvedValue({
                id: 90n,
                content: 'khong can parse',
                sepayOrderCode: 'BKV-ORDER-01',
                sepayVaId: null,
            })
            ;(
                fundraisingRepository.findSepayOrderPaymentByOrderCode as jest.Mock
            ).mockResolvedValue({
                donation: {
                    id: 61n,
                    campaignId: 7n,
                    moduleId: 11n,
                    amount: 1000,
                    status: 'PENDING',
                    matchedTransactionId: null,
                },
            })
            ;(
                fundraisingRepository.updatePaymentTransactionMatch as jest.Mock
            ).mockResolvedValue({
                id: 90n,
                matchStatus: 'MATCHED',
                matchedDonationId: 61n,
            })
            ;(fundraisingRepository.attachDonationMatch as jest.Mock).mockResolvedValue({})

            const result = await fundraisingService.handleSepayWebhook(
                {
                    transaction_id: 'tx_order_1',
                    amount: 1000,
                    code: 'BKV-ORDER-01',
                },
                {}
            )

            expect(
                fundraisingRepository.findSepayOrderPaymentByOrderCode
            ).toHaveBeenCalledWith('BKV-ORDER-01')
            expect(result).toMatchObject({
                match_status: 'MATCHED',
                matched_donation_id: 61,
            })
        })
    })

    describe('SePay API v2 sync', () => {
        it('should scope list sepay accounts by organization for LCD', async () => {
            ;(fundraisingRepository.findScopedSepayBankAccounts as jest.Mock).mockResolvedValue(
                []
            )

            await fundraisingService.listSepayAccounts(
                {},
                {
                    accountType: 'OPERATOR',
                    userId: '2',
                    role: 'LCD',
                    organizationId: '4',
                }
            )

            expect(
                fundraisingRepository.findScopedSepayBankAccounts
            ).toHaveBeenCalledWith({
                organizationId: 4n,
                where: {},
            })
            expect(fundraisingRepository.findSepayBankAccounts).not.toHaveBeenCalled()
        })

        it('should reject non-school-admin sync accounts', async () => {
            await expect(
                fundraisingService.syncSepayAccounts(
                    {},
                    {
                        accountType: 'OPERATOR',
                        userId: '2',
                        role: 'CLB',
                        organizationId: '4',
                    }
                )
            ).rejects.toMatchObject({
                statusCode: HttpStatus.FORBIDDEN,
            })
        })

        it('should sync bank accounts from SePay API v2', async () => {
            ;(sepayClient.listBankAccounts as jest.Mock).mockResolvedValue({
                data: [
                    {
                        id: 'acc_1',
                        account_holder_name: 'DOAN THANH NIEN',
                        account_number: '0000000001',
                        accumulated: 100000,
                        active: 1,
                        bank_short_name: 'BIDV',
                    },
                ],
            })
            ;(fundraisingRepository.upsertSepayBankAccount as jest.Mock).mockResolvedValue({
                id: 1n,
                sepayAccountId: 'acc_1',
                accountHolderName: 'DOAN THANH NIEN',
                accountNumber: '0000000001',
                accumulated: 100000,
                lastTransaction: null,
                label: null,
                active: true,
                bankShortName: 'BIDV',
                bankFullName: null,
                bankCode: null,
                apiMode: 'sandbox',
                metadataJson: null,
                createdAt: new Date('2026-05-26T00:00:00.000Z'),
                updatedAt: new Date('2026-05-26T00:00:00.000Z'),
            })
            ;(fundraisingRepository.upsertSepaySyncCursor as jest.Mock).mockResolvedValue({})

            const result = await fundraisingService.syncSepayAccounts(
                {},
                {
                    accountType: 'OPERATOR',
                    userId: '1',
                    role: 'DOANTRUONG',
                }
            )

            expect(sepayClient.listBankAccounts).toHaveBeenCalled()
            expect(result).toMatchObject({
                synced_count: 1,
                failed_count: 0,
            })
        })

        it('should create sepay operation request for CLB', async () => {
            ;(fundraisingRepository.createSepayOperationRequest as jest.Mock).mockResolvedValue({
                id: 77n,
                organizationId: 4n,
                requesterId: 2n,
                requesterRole: 'CLB',
                requestType: 'MAP_ACCOUNT',
                status: 'PENDING',
                sepayBankAccount: null,
                campaignId: null,
                moduleId: 11n,
                donationId: null,
                note: 'test',
                decisionNote: null,
                decidedBy: null,
                decidedAt: null,
                createdAt: new Date('2026-05-27T00:00:00.000Z'),
                updatedAt: new Date('2026-05-27T00:00:00.000Z'),
            })

            const result = await fundraisingService.createSepayOperationRequest(
                {
                    request_type: 'MAP_ACCOUNT',
                    module_id: '11',
                    note: 'test',
                },
                {
                    accountType: 'OPERATOR',
                    userId: '2',
                    role: 'CLB',
                    organizationId: '4',
                }
            )

            expect(result).toMatchObject({
                id: 77,
                request_type: 'MAP_ACCOUNT',
                status: 'PENDING',
                organization_id: 4,
            })
        })
    })
})
