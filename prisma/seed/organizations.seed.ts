import { PrismaClient } from '@prisma/client'

export const seedOrganizations = async (prisma: PrismaClient) => {
    const faculty = await prisma.faculty.findFirst({
        where: { code: '102' },
    })

    if (!faculty) {
        throw new Error('Faculty 102 missing')
    }

    await prisma.organization.upsert({
        where: { code: 'BKV-SCHOOL' },
        update: {},
        create: {
            code: 'BKV-SCHOOL',
            name: 'BK Volunteers',
            type: 'SCHOOL',
            description: 'Canonical pilot organization',
            status: 'ACTIVE',
        },
    })

    await prisma.organization.upsert({
        where: { code: 'BKV-IT' },
        update: {},
        create: {
            code: 'BKV-IT',
            name: 'IT Faculty Volunteers',
            type: 'FACULTY_CLUB',
            facultyId: faculty.id,
            description: 'Faculty volunteer operator',
            status: 'ACTIVE',
        },
    })
}

