import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'

export async function seedStudents(prisma: PrismaClient): Promise<void> {
    console.log('Seeding students...')
    const faculty = await prisma.faculty.findFirst({
        orderBy: { id: 'asc' },
    })

    if (!faculty) {
        throw new Error('Cannot seed students without at least one faculty')
    }

    const title = await prisma.title.findFirst({
        orderBy: { minPoints: 'asc' },
    })

    const students = [
        {
            studentCode: '102210001',
            email: '102210001@sv1.dut.udn.vn',
            fullName: 'Nguyen Van A',
            classCode: '22TCLC1',
            major: 'Computer Science',
            year: 2,
        },
        {
            studentCode: '102210002',
            email: '102210002@sv1.dut.udn.vn',
            fullName: 'Tran Thi B',
            classCode: '22TCLC1',
            major: 'Computer Science',
            year: 2,
        },
        {
            studentCode: '102210003',
            email: '102210003@sv1.dut.udn.vn',
            fullName: 'Le Van C',
            classCode: '22TCLC1',
            major: 'Computer Science',
            year: 2,
        },
    ]

    for (const student of students) {
        await prisma.student.upsert({
            where: { studentCode: student.studentCode },
            update: {},
            create: {
                facultyId: faculty.id,
                currentTitleId: title?.id,
                studentCode: student.studentCode,
                email: student.email,
                passwordHash: await argon2.hash(student.studentCode),
                fullName: student.fullName,
                classCode: student.classCode,
                major: student.major,
                year: student.year,
                totalPoints: 0,
                status: 'ACTIVE',
            },
        })
    }

    console.log(`Seeded ${students.length} students`)
}
