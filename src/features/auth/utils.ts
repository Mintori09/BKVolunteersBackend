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

export function isMssv(username: string): boolean {
    if (typeof username !== 'string') {
        return false
    }

    const mssvRegex = /^1\d{8}$/
    if (!mssvRegex.test(username)) {
        return false
    }

    const facultyId = username.substring(0, 3) // "105"
    const admissionYear = username.substring(3, 5) // "22"

    return (
        VALID_FACULTY_CODES.includes(facultyId) &&
        isValidAdmissionYear(admissionYear)
    )
}

export function isValidAdmissionYear(admissionYearStr: string): boolean {
    const admissionYear = Number(admissionYearStr)
    const currentYear = new Date().getFullYear() // 2026
    const currentYearLastTwo = currentYear % 100 // 26

    let fullAdmissionYear: number

    if (admissionYear > currentYearLastTwo) {
        fullAdmissionYear = 1900 + admissionYear
    } else {
        fullAdmissionYear = 2000 + admissionYear
    }

    const yearDiff = currentYear - fullAdmissionYear

    if (yearDiff < 0 || yearDiff > 8) {
        return false
    }

    const currentMonth = new Date().getMonth() + 1
    if (currentMonth <= 9 && fullAdmissionYear === currentYear) {
        // Chưa đến tháng 10, chưa nhận khóa của năm hiện tại
        return false
    }

    return true
}
