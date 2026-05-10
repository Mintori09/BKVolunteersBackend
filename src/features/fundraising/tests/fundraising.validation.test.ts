import {
    createFundraisingDonationSchema,
    fundraisingDecisionSchema,
    listFundraisingDonationsSchema,
    sepayWebhookSchema,
} from '../fundraising.validation'

describe('fundraising.validation', () => {
    describe('createFundraisingDonationSchema', () => {
        it('should coerce amount to number', () => {
            const parsed = createFundraisingDonationSchema.body!.parse({
                amount: '100000',
                donor_name: 'Nguyen Van A',
            })

            expect(parsed).toEqual({
                amount: 100000,
                donor_name: 'Nguyen Van A',
            })
        })

        it('should reject non-positive amount', () => {
            expect(() =>
                createFundraisingDonationSchema.body!.parse({
                    amount: 0,
                })
            ).toThrow()
        })
    })

    describe('listFundraisingDonationsSchema', () => {
        it('should coerce page and limit query params', () => {
            const parsed = listFundraisingDonationsSchema.query!.parse({
                page: '2',
                limit: '20',
            })

            expect(parsed).toEqual({
                page: 2,
                limit: 20,
            })
        })

        it('should reject limit greater than 100', () => {
            expect(() =>
                listFundraisingDonationsSchema.query!.parse({
                    limit: '101',
                })
            ).toThrow()
        })
    })

    describe('fundraisingDecisionSchema', () => {
        it('should accept optional reason fields', () => {
            const parsed = fundraisingDecisionSchema.body!.parse({
                reason: 'Da doi soat',
                reject_reason: 'Khong hop le',
            })

            expect(parsed).toEqual({
                reason: 'Da doi soat',
                reject_reason: 'Khong hop le',
            })
        })
    })

    describe('sepayWebhookSchema', () => {
        it('should allow passthrough extra fields and coerce amount', () => {
            const parsed = sepayWebhookSchema.body!.parse({
                transaction_id: 'tx_001',
                amount: '50000',
                module_id: '11',
                extra_field: 'keep-me',
            })

            expect(parsed).toMatchObject({
                transaction_id: 'tx_001',
                amount: 50000,
                module_id: '11',
                extra_field: 'keep-me',
            })
        })
    })
})
