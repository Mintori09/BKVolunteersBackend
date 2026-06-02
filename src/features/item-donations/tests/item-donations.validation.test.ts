import {
    confirmItemPledgeSchema,
    createItemPledgeSchema,
    itemDonationModuleSchema,
} from '../item-donations.validation'

describe('item-donations.validation', () => {
    describe('itemDonationModuleSchema', () => {
        it('should accept numeric module id', () => {
            const result = itemDonationModuleSchema.params?.parse({
                moduleId: '21',
            })

            expect(result).toEqual({ moduleId: '21' })
        })
    })

    describe('createItemPledgeSchema', () => {
        it('should coerce quantity to number', () => {
            const result = createItemPledgeSchema.body?.parse({
                item_target_id: '8',
                quantity: '3',
            })

            expect(result).toEqual({
                item_target_id: '8',
                quantity: 3,
            })
        })

        it('should reject non-positive quantity', () => {
            expect(() =>
                createItemPledgeSchema.body?.parse({
                    item_target_id: '8',
                    quantity: 0,
                })
            ).toThrow()
        })
    })

    describe('confirmItemPledgeSchema', () => {
        it('should reject invalid pledge id', () => {
            expect(() =>
                confirmItemPledgeSchema.params?.parse({ id: 'abc' })
            ).toThrow()
        })
    })
})
