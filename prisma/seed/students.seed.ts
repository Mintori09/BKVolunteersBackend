import * as fs from 'fs'
import * as path from 'path'
import * as argon2 from 'argon2'
import { PrismaClient } from '@prisma/client'

interface StudentCsv {
    mssv: string
    fullName: string
    className: string | null
    facultyId: number
}

function parseMSSV(mssv: string): {
    facultyCode: string
    admissionYear: string
    sequence: string
} {
    const facultyCode = mssv.substring(0, 3)
    const admissionYear = mssv.substring(3, 5)
    const sequence = mssv.substring(5, 9)

    return { facultyCode, admissionYear, sequence }
}

async function hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
        type: argon2.argon2id,
        timeCost: 1,
        memoryCost: 1024,
        parallelism: 1,
    })
}

function parseStudentsCsv(csvText: string): Array<Omit<StudentCsv, 'facultyId'>> {
    const lines = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

    if (lines.length <= 1) {
        return []
    }

    return lines.slice(1).map((line, index) => {
        const columns = line.split(',')
        const mssv = columns[0]?.trim()
        const fullName = columns[1]?.trim()
        const className = columns[2]?.trim() || null

        if (!mssv || !fullName) {
            throw new Error(`Invalid student CSV row at line ${index + 2}: ${line}`)
        }

        return {
            mssv,
            fullName,
            className,
        }
    })
}

export async function seedStudents(prisma: PrismaClient): Promise<void> {
    console.log('Seeding students...')

    const csvPath = path.join(import.meta.dirname, '..', 'students.csv')
    const csvText = fs.readFileSync(csvPath, 'utf-8')
    const rawStudents = parseStudentsCsv(csvText)

    const faculties = await prisma.faculty.findMany({
        select: {
            id: true,
            code: true,
        },
    })
    const facultyByCode = new Map(
        faculties.map((faculty) => [faculty.code, faculty.id])
    )

    if (facultyByCode.size === 0) {
        throw new Error('No faculty found. Please run faculty seed first.')
    }

    const students: StudentCsv[] = rawStudents.map((student) => {
        const { facultyCode } = parseMSSV(student.mssv)
        const facultyId = facultyByCode.get(facultyCode)

        if (!facultyId) {
            throw new Error(
                `Unknown faculty code from MSSV "${student.mssv}": ${facultyCode}`
            )
        }

        return {
            ...student,
            facultyId,
        }
    })

    const mssvs = students.map((student) => student.mssv)

    const existingUsers = await prisma.user.findMany({
        where: {
            username: {
                in: mssvs,
            },
        },
        select: {
            id: true,
            username: true,
        },
    })

    const userIdByUsername = new Map(
        existingUsers.map((user) => [user.username, user.id])
    )

    const usersToCreate: Array<{
        id: string
        username: string
        email: string
        passwordHash: string
        accountType: 'STUDENT'
        status: 'ACTIVE'
    }> = []

    for (const student of students) {
        if (userIdByUsername.has(student.mssv)) {
            continue
        }

        const userId = crypto.randomUUID()
        const passwordHash = await hashPassword(student.mssv)

        usersToCreate.push({
            id: userId,
            username: student.mssv,
            email: `${student.mssv}@sv1.dut.udn.vn`,
            passwordHash,
            accountType: 'STUDENT',
            status: 'ACTIVE',
        })

        userIdByUsername.set(student.mssv, userId)
    }

    if (usersToCreate.length > 0) {
        await prisma.user.createMany({
            data: usersToCreate,
            skipDuplicates: true,
        })
    }

    const existingStudents = await prisma.student.findMany({
        where: {
            mssv: {
                in: mssvs,
            },
        },
        select: {
            mssv: true,
        },
    })
    const existingStudentMssvSet = new Set(
        existingStudents.map((student) => student.mssv)
    )

    const studentsToCreate = students
        .filter((student) => !existingStudentMssvSet.has(student.mssv))
        .map((student) => {
            const userId = userIdByUsername.get(student.mssv)

            if (!userId) {
                throw new Error(`Missing user id for student ${student.mssv}`)
            }

            return {
                id: crypto.randomUUID(),
                userId,
                mssv: student.mssv,
                fullName: student.fullName,
                facultyId: student.facultyId,
                className: student.className,
                phone: null,
                totalPoints: 0,
            }
        })

    if (studentsToCreate.length > 0) {
        await prisma.student.createMany({
            data: studentsToCreate,
            skipDuplicates: true,
        })
    }

    console.log(
        `Seeded students: total=${students.length}, users_created=${usersToCreate.length}, students_created=${studentsToCreate.length}`
    )
}
