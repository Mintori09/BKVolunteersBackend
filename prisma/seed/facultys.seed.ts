import { PrismaClient } from '@prisma/client'

const FACULTY_DATA: Array<{ code: string; name: string }> = [
    { code: '101', name: 'Khoa Cơ khí' },
    { code: '102', name: 'Khoa Công nghệ Thông tin' },
    { code: '103', name: 'Khoa Cơ khí Giao thông' },
    { code: '104', name: 'Khoa CN Nhiệt-Điện lạnh' },
    { code: '105', name: 'Khoa Điện' },
    { code: '106', name: 'Khoa Điện tử Viễn thông' },
    { code: '107', name: 'Khoa Hóa' },
    { code: '109', name: 'Khoa Xây dựng Cầu Đường' },
    { code: '110', name: 'Khoa Xây dựng Dân dụng & Công nghiệp' },
    { code: '111', name: 'Khoa Xây dựng Công trình thủy' },
    { code: '117', name: 'Khoa Môi trường' },
    { code: '118', name: 'Khoa Quản lý dự án' },
    { code: '121', name: 'Khoa Kiến trúc' },
    { code: '123', name: 'Khoa Khoa học Công nghệ tiên tiến' },
]

export async function seedFaculties(prisma: PrismaClient): Promise<void> {
    console.log('Seeding faculties...')

    for (const faculty of FACULTY_DATA) {
        await prisma.faculty.upsert({
            where: { code: faculty.code },
            update: {},
            create: {
                code: faculty.code,
                name: faculty.name,
            },
        })
    }

    console.log(`Seeded ${FACULTY_DATA.length} faculties`)
}
