import {
    createCertificateTemplateSchema,
    generateCertificatesSchema,
    revokeCertificateSchema,
} from '../certificates.validation'

describe('certificates.validation', () => {
    describe('createCertificateTemplateSchema', () => {
        it('should parse valid template body', () => {
            const parsed = createCertificateTemplateSchema.body!.parse({
                name: 'Chung nhan tinh nguyen vien',
                type: 'CAMPAIGN_COMPLETION',
                layout_json: { color: 'blue' },
            })

            expect(parsed).toEqual({
                name: 'Chung nhan tinh nguyen vien',
                type: 'CAMPAIGN_COMPLETION',
                layout_json: { color: 'blue' },
            })
        })

        it('should reject empty template name', () => {
            expect(() =>
                createCertificateTemplateSchema.body!.parse({
                    name: '   ',
                })
            ).toThrow()
        })
    })

    describe('generateCertificatesSchema', () => {
        it('should accept either template_id or templateId with numeric strings', () => {
            const parsed = generateCertificatesSchema.body!.parse({
                template_id: '1',
                module_id: '11',
            })

            expect(parsed).toEqual({
                template_id: '1',
                module_id: '11',
            })
        })

        it('should reject non-numeric module_id', () => {
            expect(() =>
                generateCertificatesSchema.body!.parse({
                    templateId: '1',
                    module_id: 'module-a',
                })
            ).toThrow()
        })
    })

    describe('revokeCertificateSchema', () => {
        it('should accept optional revoke reasons', () => {
            const parsed = revokeCertificateSchema.body!.parse({
                reason: 'Sai thong tin',
                revoke_reason: 'Sai thong tin',
            })

            expect(parsed).toEqual({
                reason: 'Sai thong tin',
                revoke_reason: 'Sai thong tin',
            })
        })
    })
})
