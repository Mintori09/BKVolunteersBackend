import { isMssv } from '../utils'

describe('isMssv', () => {
    describe('isMssv - Dynamic Validation Tests', () => {
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1
        const currentYearShort = currentYear % 100

        // Hàm tiện ích để tạo MSSV giả lập
        const generateMssv = (
            faculty: string,
            yearShort: number,
            seq: string = '0001'
        ) => {
            // Đảm bảo yearShort luôn có 2 chữ số (ví dụ: 5 -> '05')
            const yearStr = yearShort.toString().padStart(2, '0')
            return `${faculty}${yearStr}${seq}`
        }

        it('should return true for MSSV from the most recent valid year', () => {
            // Nếu trước tháng 10, năm gần nhất hợp lệ là (năm hiện tại - 1)
            // Nếu từ tháng 10 trở đi, năm gần nhất hợp lệ là năm hiện tại
            const latestYear =
                currentMonth <= 9 ? currentYearShort - 1 : currentYearShort
            const validMssv = generateMssv('105', latestYear)

            expect(isMssv(validMssv)).toBe(true)
        })

        it('should return true for MSSV from exactly 8 years ago', () => {
            // Tính toán năm cách đây đúng 8 năm
            let eightYearsAgo = currentYearShort - 8
            if (eightYearsAgo < 0) eightYearsAgo += 100 // Xử lý nếu quay về thế kỷ trước (ví dụ: 05 - 8 = 97)

            const edgeCaseMssv = generateMssv('101', eightYearsAgo)
            expect(isMssv(edgeCaseMssv)).toBe(true)
        })

        it('should return true for all valid faculty codes with a safe year', () => {
            // Năm "an toàn" nhất để test là năm ngoái (luôn đúng bất kể tháng nào)
            const safeYear = currentYearShort - 1
            const VALID_FACULTY_CODES = [
                '101',
                '102',
                '103',
                '104',
                '105',
                '106',
                '107',
                '109',
                '110',
                '111',
                '117',
                '118',
                '121',
                '123',
            ]

            VALID_FACULTY_CODES.forEach((code) => {
                const mssv = generateMssv(code, safeYear)
                expect(isMssv(mssv)).toBe(true)
            })
        })

        it('should return false for a year that is 9 years old (out of range)', () => {
            let nineYearsAgo = currentYearShort - 9
            if (nineYearsAgo < 0) nineYearsAgo += 100

            const invalidOldMssv = generateMssv('105', nineYearsAgo)
            expect(isMssv(invalidOldMssv)).toBe(false)
        })

        it('should handle future year correctly based on current month', () => {
            // Test năm hiện tại
            const currentYearMssv = generateMssv('105', currentYearShort)

            if (currentMonth <= 9) {
                // Trước tháng 10, mã năm hiện tại phải bị từ chối
                expect(isMssv(currentYearMssv)).toBe(false)
            } else {
                // Từ tháng 10 trở đi, mã năm hiện tại phải được chấp nhận
                expect(isMssv(currentYearMssv)).toBe(true)
            }
        })
    })

    describe('invalid MSSV format - Dynamic Tests', () => {
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentYearShort = currentYear % 100
        const currentMonth = now.getMonth() + 1

        // Hàm tạo MSSV nhanh
        const gen = (
            faculty: string,
            year: number | string,
            seq: string = '0001'
        ) => {
            const yearStr =
                typeof year === 'number'
                    ? year.toString().padStart(2, '0')
                    : year
            return `${faculty}${yearStr}${seq}`
        }

        it('should return false for MSSV older than 8 years', () => {
            // Tính năm cách đây 9 năm (chắc chắn vi phạm logic <= 8)
            let nineYearsAgo = currentYearShort - 9
            if (nineYearsAgo < 0) nineYearsAgo += 100

            const oldMssv = gen('105', nineYearsAgo)
            expect(isMssv(oldMssv)).toBe(false)
        })

        it('should return false for future years', () => {
            // Năm sau (currentYear + 1) luôn là sai
            const futureYear = (currentYearShort + 1) % 100
            const futureMssv = gen('105', futureYear)

            expect(isMssv(futureMssv)).toBe(false)
        })

        it('should return false for current year if before October', () => {
            const currentYearMssv = gen('105', currentYearShort)

            if (currentMonth <= 9) {
                // Nếu đang trong tháng 1-9, mã năm hiện tại chưa được phép tồn tại
                expect(isMssv(currentYearMssv)).toBe(false)
            }
        })

        it('should return false for invalid faculty codes', () => {
            // '999' không nằm trong VALID_FACULTY_CODES
            const invalidFaculty = gen('999', currentYearShort - 1)
            expect(isMssv(invalidFaculty)).toBe(false)
        })

        it('should return false for malformed strings (already dynamic by nature)', () => {
            // Các test case tĩnh về định dạng vẫn quan trọng
            expect(isMssv('12345678')).toBe(false) // Thiếu số
            expect(isMssv('1234567890')).toBe(false) // Thừa số
            expect(isMssv('ABCDE6789')).toBe(false) // Có chữ
            expect(isMssv('12345 678')).toBe(false) // Có khoảng trắng
            expect(isMssv('!@#$%^&*(')).toBe(false) // Ký tự đặc biệt
        })

        it('should return false for non-string types', () => {
            expect(isMssv(null as any)).toBe(false)
            expect(isMssv(undefined as any)).toBe(false)
            expect(isMssv(123456789 as any)).toBe(false)
        })

        it('should return false for your specific failing case "123456789"', () => {
            // Giải thích: 123 là khoa hợp lệ, nhưng 45 là năm 1945 -> Sai vì > 8 năm
            expect(isMssv('123456789')).toBe(false)
        })
    })

    describe('True or false depend on current date', () => {
        const currentYear = new Date().getFullYear()
        const currentYearShort = currentYear % 100
        const currentMonth = new Date().getMonth() + 1

        // Hàm helper để tạo MSSV nhanh cho việc test
        const genMssv = (yearShort: number) => {
            const yearStr = String(yearShort).padStart(2, '0')
            return `102${yearStr}0108` // Khoa 102, STT 0108
        }

        it('should validate new student based on admission month (October rule)', () => {
            const studentId = genMssv(currentYearShort)

            // Nếu là tháng 10, 11, 12 -> True
            // Nếu là tháng 1-9 -> False
            const expected = currentMonth > 9
            expect(isMssv(studentId)).toBe(expected)
        })

        it('should always return true for students who started last year', () => {
            // Năm ngoái (current - 1) thì bất kể tháng nào cũng phải là true
            const lastYearShort = (currentYearShort - 1 + 100) % 100
            const studentId = genMssv(lastYearShort)

            expect(isMssv(studentId)).toBe(true)
        })

        it('should always return false for students who started 9 years ago', () => {
            // Năm hiện tại - 9 năm -> Phải luôn false do logic yearDiff > 8
            const nineYearsAgoShort = (currentYearShort - 9 + 100) % 100
            const studentId = genMssv(nineYearsAgoShort)

            expect(isMssv(studentId)).toBe(false)
        })

        it('should always return false for future students (next year)', () => {
            // Năm sau (current + 1) -> Luôn false
            const nextYearShort = (currentYearShort + 1) % 100
            const studentId = genMssv(nextYearShort)

            expect(isMssv(studentId)).toBe(false)
        })
    })
})
