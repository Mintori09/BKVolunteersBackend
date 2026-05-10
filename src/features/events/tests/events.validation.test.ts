import {
    eventApproveSchema,
    eventModuleParamsSchema,
    eventRegisterSchema,
} from '../events.validation'

describe('events.validation', () => {
    describe('eventModuleParamsSchema', () => {
        it('should accept numeric module id', () => {
            const result = eventModuleParamsSchema.params?.parse({
                moduleId: '11',
            })

            expect(result).toEqual({ moduleId: '11' })
        })

        it('should reject invalid module id', () => {
            expect(() =>
                eventModuleParamsSchema.params?.parse({ moduleId: 'abc' })
            ).toThrow()
        })
    })

    describe('eventRegisterSchema', () => {
        it('should accept nullable answers_json', () => {
            const result = eventRegisterSchema.body?.parse({
                answers_json: null,
            })

            expect(result).toEqual({ answers_json: null })
        })

        it('should accept record answers_json', () => {
            const result = eventRegisterSchema.body?.parse({
                answers_json: {
                    shirt_size: 'L',
                    sessions: 2,
                },
            })

            expect(result).toEqual({
                answers_json: {
                    shirt_size: 'L',
                    sessions: 2,
                },
            })
        })
    })

    describe('eventApproveSchema', () => {
        it('should accept optional note', () => {
            const result = eventApproveSchema.body?.parse({
                note: 'Duyet',
            })

            expect(result).toEqual({ note: 'Duyet' })
        })
    })
})
