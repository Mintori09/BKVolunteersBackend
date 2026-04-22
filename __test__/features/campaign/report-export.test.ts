import ExcelJS from 'exceljs'
import {
    buildReportIssuedDateText,
    replaceWorkbookPlaceholders,
    resolvePvcdPointByContribution,
    writeReportRows,
} from '../../../src/features/campaign/campaign.service'

describe('campaign report export helpers', () => {
    it('maps PVCD points using fundraising contribution ranges', () => {
        expect(resolvePvcdPointByContribution(19999)).toBe(0)
        expect(resolvePvcdPointByContribution(20000)).toBe(5)
        expect(resolvePvcdPointByContribution(29999)).toBe(5)
        expect(resolvePvcdPointByContribution(30000)).toBe(7)
        expect(resolvePvcdPointByContribution(49999)).toBe(7)
        expect(resolvePvcdPointByContribution(50000)).toBe(8)
        expect(resolvePvcdPointByContribution(99999)).toBe(8)
        expect(resolvePvcdPointByContribution(100000)).toBe(10)
    })

    it('builds Da Nang issue date text from export time', () => {
        const issueDate = new Date('2026-04-15T10:00:00+07:00')
        expect(buildReportIssuedDateText(issueDate)).toBe(
            'Đà Nẵng, ngày 15 tháng 04 năm 2026'
        )
    })

    it('replaces plain and rich text placeholders in worksheet', () => {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Report')

        worksheet.getCell('A1').value = '[TÊN CHIẾN DỊCH]'
        worksheet.getCell('A2').value = {
            richText: [{ text: 'Đà Nẵng, ngày... Tháng... năm 202…' }],
        }

        replaceWorkbookPlaceholders(worksheet, {
            '[TÊN CHIẾN DỊCH]': 'Chiến dịch mẫu',
            'Đà Nẵng, ngày... Tháng... năm 202…':
                'Đà Nẵng, ngày 15 tháng 04 năm 2026',
        })

        expect(worksheet.getCell('A1').value).toBe('Chiến dịch mẫu')
        expect(worksheet.getCell('A2').value).toEqual({
            richText: [{ text: 'Đà Nẵng, ngày 15 tháng 04 năm 2026' }],
        })
    })

    it('inserts extra rows and draws table borders when row count is greater than one', () => {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Report')
        const templateRowIndex = 5

        const templateRow = worksheet.getRow(templateRowIndex)
        for (let column = 1; column <= 7; column += 1) {
            const cell = templateRow.getCell(column)
            cell.style = {
                font: { name: 'Times New Roman', size: 12 },
                alignment: { vertical: 'middle', horizontal: 'center' },
            }
        }
        templateRow.height = 22

        writeReportRows(
            worksheet,
            templateRowIndex,
            [
                [1, '102260001', 'Sinh vien 1', '24TCLC01', 20000, 5, '✅ Đã xác nhận'],
                [2, '102260002', 'Sinh vien 2', '24TCLC02', 30000, 7, '✅ Đã xác nhận'],
            ],
            7
        )

        expect(worksheet.getCell('A5').value).toBe(1)
        expect(worksheet.getCell('B6').value).toBe('102260002')
        expect(worksheet.getCell('G6').value).toBe('✅ Đã xác nhận')

        const border = worksheet.getCell('C6').border
        expect(border.top?.style).toBe('thin')
        expect(border.right?.style).toBe('thin')
        expect(border.bottom?.style).toBe('thin')
        expect(border.left?.style).toBe('thin')

        expect(worksheet.getRow(6).height).toBe(22)
        expect(worksheet.getCell('A6').style.font).toEqual({
            name: 'Times New Roman',
            size: 12,
        })
    })
})
