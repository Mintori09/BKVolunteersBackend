import * as argon2 from 'argon2'
import { PrismaClient } from '@prisma/client'

export const seedOperators = async (prisma: PrismaClient) => {
    const renameIfNeeded = async (oldEmail: string, newEmail: string) => {
        const oldAccount = await prisma.operatorAccount.findUnique({
            where: { email: oldEmail },
            select: { id: true },
        })
        const newAccount = await prisma.operatorAccount.findUnique({
            where: { email: newEmail },
            select: { id: true },
        })
        if (oldAccount && !newAccount) {
            await prisma.operatorAccount.update({
                where: { email: oldEmail },
                data: { email: newEmail },
            })
        }
    }

    await renameIfNeeded('operator@bkv.local', 'doantruong.bkv@dut.udn.vn')
    await renameIfNeeded('club@bkvolunteers.local', 'clb.cntt@dut.udn.vn')

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
        where: { email: 'doantruong.bkv@dut.udn.vn' },
        update: {
            organizationId: schoolOrg.id,
            fullName: 'Đoàn Trường BK Volunteers',
            role: 'DOANTRUONG',
            status: 'ACTIVE',
        },
        create: {
            organizationId: schoolOrg.id,
            email: 'doantruong.bkv@dut.udn.vn',
            passwordHash: await argon2.hash('Password123'),
            fullName: 'Đoàn Trường BK Volunteers',
            role: 'DOANTRUONG',
            status: 'ACTIVE',
        },
    })

    await prisma.operatorAccount.upsert({
        where: { email: 'clb.cntt@dut.udn.vn' },
        update: {
            organizationId: facultyOrg.id,
            facultyId: faculty.id,
            fullName: 'CLB Tình nguyện CNTT',
            role: 'CLB',
            status: 'ACTIVE',
        },
        create: {
            organizationId: facultyOrg.id,
            facultyId: faculty.id,
            email: 'clb.cntt@dut.udn.vn',
            passwordHash: await argon2.hash('Password123'),
            fullName: 'CLB Tình nguyện CNTT',
            role: 'CLB',
            status: 'ACTIVE',
        },
    })
}

