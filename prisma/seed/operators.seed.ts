import * as argon2 from 'argon2'
import { PrismaClient } from '@prisma/client'

export const seedOperators = async (prisma: PrismaClient) => {
    const schoolOrg = await prisma.organization.findUnique({
        where: { code: 'BKV-SCHOOL' },
    })
    const facultyOrg = await prisma.organization.findUnique({
        where: { code: 'BKV-IT' },
    })
    const faculty = await prisma.faculty.findFirst({
        where: { code: '102' },
    })

    if (!schoolOrg || !facultyOrg || !faculty) {
        throw new Error('Organization seed prerequisite missing')
    }

    await prisma.operatorAccount.upsert({
        where: { email: 'operator@bkv.local' },
        update: {},
        create: {
            organizationId: schoolOrg.id,
            email: 'operator@bkv.local',
            passwordHash: await argon2.hash('Password123'),
            fullName: 'School Operator',
            role: 'SCHOOL_ADMIN',
            status: 'ACTIVE',
        },
    })

    await prisma.operatorAccount.upsert({
        where: { email: 'club@bkvolunteers.local' },
        update: {},
        create: {
            organizationId: facultyOrg.id,
            facultyId: faculty.id,
            email: 'club@bkvolunteers.local',
            passwordHash: await argon2.hash('Password123'),
            fullName: 'Faculty Club Operator',
            role: 'ORG_ADMIN',
            status: 'ACTIVE',
        },
    })
}

