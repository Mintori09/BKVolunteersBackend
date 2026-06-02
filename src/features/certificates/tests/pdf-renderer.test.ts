import { describe, expect, it } from '@jest/globals'
import { renderCertificatePdf } from '../pdf-renderer'

describe('certificate pdf renderer', () => {
    it('returns a PDF buffer with standard header', () => {
        const buffer = renderCertificatePdf({
            certificateNo: 'CERT-7-42',
            templateName: 'Volunteer MVP Certificate',
            layoutJson: {},
            values: {
                student_name: 'Nguyen Van A',
                student_code: '102210001',
                campaign_title: 'MVP Chien Dich Thien Nguyen',
                module_title: 'Tinh nguyen vien su kien',
                issued_at: '22/05/2026',
            },
        })

        expect(buffer.toString('utf8', 0, 8)).toBe('%PDF-1.4')
    })
})
