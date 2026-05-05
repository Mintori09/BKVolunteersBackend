import * as argon2 from 'argon2'
import { PrismaClient } from '@prisma/client'

const STUDENT_FIXTURES = [
    {
        studentCode: '102220001',
        email: '102220001@sv1.dut.udn.vn',
        fullName: 'Nguyen Van An',
        facultyCode: '102',
        classCode: '22T_DT1',
        major: 'Cong nghe thong tin',
        year: 2022,
    },
    {
        studentCode: '105220001',
        email: '105220001@sv1.dut.udn.vn',
        fullName: 'Tran Thi Binh',
        facultyCode: '105',
        classCode: '22D_DT1',
        major: 'Ky thuat dien',
        year: 2022,
    },
]

export async function seedStudents(prisma: PrismaClient): Promise<void> {
    console.log('Seeding contract students...')

    for (const student of STUDENT_FIXTURES) {
        const faculty = await prisma.faculty.findUnique({
            where: { code: student.facultyCode },
        })

        if (!faculty) {
            throw new Error(`Faculty ${student.facultyCode} must be seeded first`)
        }

        await prisma.student.upsert({
            where: { studentCode: student.studentCode },
            update: {
                email: student.email,
                fullName: student.fullName,
                facultyId: faculty.id,
                classCode: student.classCode,
                major: student.major,
                year: student.year,
            },
            create: {
                studentCode: student.studentCode,
                email: student.email,
                passwordHash: await argon2.hash(student.studentCode),
                fullName: student.fullName,
                facultyId: faculty.id,
                classCode: student.classCode,
                major: student.major,
                year: student.year,
            },
        })
    }

    console.log(`Seeded ${STUDENT_FIXTURES.length} contract students`)
}
