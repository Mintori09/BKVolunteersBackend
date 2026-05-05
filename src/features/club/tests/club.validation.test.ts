import {
    createClubSchema,
    updateClubSchema,
    getClubsSchema,
    clubIdSchema,
} from '../club.validation'

describe('Club Validation Schemas', () => {
    describe('createClubSchema', () => {
        it('nên chấp nhận dữ liệu hợp lệ', () => {
            const validData = {
                body: {
                    name: 'CLB Âm Nhạc',
                    facultyId: 1,
                    leaderId: 'uuid-123',
                },
            }
            const result = createClubSchema.body?.safeParse(validData.body)
            expect(result?.success).toBe(true)
        })

        it('nên báo lỗi nếu "name" trống hoặc quá dài', () => {
            const invalidData = { body: { name: '' } }
            const result = createClubSchema.body?.safeParse(invalidData.body)
            expect(result?.success).toBe(false)

            const longName = 'a'.repeat(256)
            const resultLong = createClubSchema.body?.safeParse({
                name: longName,
            })
            expect(resultLong?.success).toBe(false)
        })

        it('nên chấp nhận nếu thiếu facultyId và leaderId (vì là optional)', () => {
            const minimalData = { body: { name: 'CLB Võ Thuật' } }
            const result = createClubSchema.body?.safeParse(minimalData.body)
            expect(result?.success).toBe(true)
        })
    })

    describe('updateClubSchema', () => {
        it('nên báo lỗi nếu "id" trong params trống', () => {
            const invalidParams = { id: '' }
            const result = updateClubSchema.params?.safeParse(invalidParams)
            expect(result?.success).toBe(false)
        })

        it('nên chấp nhận khi cập nhật một phần dữ liệu (name hoặc facultyId)', () => {
            const validBody = { name: 'Tên mới' }
            const result = updateClubSchema.body?.safeParse(validBody)
            expect(result?.success).toBe(true)
        })

        it('nên cho phép facultyId hoặc leaderId là null', () => {
            const validBody = { facultyId: null, leaderId: null }
            const result = updateClubSchema.body?.safeParse(validBody)
            expect(result?.success).toBe(true)
        })
    })

    describe('getClubsSchema (Query Validation)', () => {
        it('nên tự động ép kiểu (coerce) chuỗi sang số và áp dụng giá trị mặc định', () => {
            const queryData = {
                page: '2',
                limit: '15',
            }
            const result = getClubsSchema.query?.safeParse(queryData)

            expect(result?.success).toBe(true)
            if (result?.success) {
                expect(result.data.page).toBe(2) // String '2' -> Number 2
                expect(result.data.limit).toBe(15)
            }
        })

        it('nên sử dụng giá trị mặc định nếu không cung cấp page/limit', () => {
            const result = getClubsSchema.query?.safeParse({})
            expect(result?.success).toBe(true)
            if (result?.success) {
                expect(result.data.page).toBe(1)
                expect(result.data.limit).toBe(20)
            }
        })

        it('nên báo lỗi nếu limit vượt quá 50', () => {
            const result = getClubsSchema.query?.safeParse({ limit: '100' })
            expect(result?.success).toBe(false)
        })
    })

    describe('clubIdSchema', () => {
        it('nên chấp nhận ID hợp lệ', () => {
            const result = clubIdSchema.params?.safeParse({
                id: 'any-id-string',
            })
            expect(result?.success).toBe(true)
        })

        it('nên từ chối ID nếu là chuỗi rỗng', () => {
            const result = clubIdSchema.params?.safeParse({ id: '' })
            expect(result?.success).toBe(false)
        })
    })
})
