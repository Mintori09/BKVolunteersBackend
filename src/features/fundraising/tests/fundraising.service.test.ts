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
            })
        })
    })

    describe('verifyDonation', () => {
        it('should reject non-pending donation', async () => {
            ;(fundraisingRepository.findDonationById as jest.Mock).mockResolvedValue({
                id: 51n,
                status: 'VERIFIED',
            })

            await expect(
                fundraisingService.verifyDonation(
                    '51',
                    {},
                    { accountType: 'OPERATOR', userId: '9' }
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
                { accountType: 'OPERATOR', userId: '9' }
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
    })
})
