import * as argon2 from 'argon2'
import { PrismaClient } from '@prisma/client'

export async function seedContractFixtures(prisma: PrismaClient): Promise<void> {
    console.log('Seeding contract organizations and campaign fixtures...')
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

    await renameIfNeeded('school.admin@dut.udn.vn', 'doantruong.dut@dut.udn.vn')
    await renameIfNeeded('reviewer@dut.udn.vn', 'lcd.reviewer@dut.udn.vn')
    await renameIfNeeded('lcd.cntt@dut.udn.vn', 'clb.lcdcntt@dut.udn.vn')

    const faculty = await prisma.faculty.findUnique({ where: { code: '102' } })
    if (!faculty) {
        throw new Error('Faculty 102 must be seeded first')
    }

    const schoolUnion = await prisma.organization.upsert({
        where: { code: 'DOAN_TRUONG' },
        update: {},
        create: {
            code: 'DOAN_TRUONG',
            name: 'Doan truong Dai hoc Bach khoa',
            type: 'SCHOOL_UNION',
            description: 'Don vi duyet va dieu phoi chien dich cap truong',
        },
    })

    const facultyUnion = await prisma.organization.upsert({
        where: { code: 'LCD_CNTT' },
        update: {
            facultyId: faculty.id,
        },
        create: {
            code: 'LCD_CNTT',
            name: 'Lien chi doan Khoa Cong nghe Thong tin',
            type: 'FACULTY_UNION',
            facultyId: faculty.id,
            description: 'Don vi to chuc chien dich cap khoa',
        },
    })

    const schoolAdmin = await prisma.operatorAccount.upsert({
        where: { email: 'doantruong.dut@dut.udn.vn' },
        update: {
            organizationId: schoolUnion.id,
            fullName: 'Đoàn Trường Đại học Bách khoa',
            role: 'DOANTRUONG',
            status: 'ACTIVE',
        },
        create: {
            email: 'doantruong.dut@dut.udn.vn',
            passwordHash: await argon2.hash('Password123'),
            fullName: 'Đoàn Trường Đại học Bách khoa',
            role: 'DOANTRUONG',
            organizationId: schoolUnion.id,
            status: 'ACTIVE',
        },
    })

    await prisma.operatorAccount.upsert({
        where: { email: 'lcd.reviewer@dut.udn.vn' },
        update: {
            organizationId: schoolUnion.id,
            fullName: 'Reviewer Liên Chi Đoàn',
            role: 'LCD',
            status: 'ACTIVE',
        },
        create: {
            email: 'lcd.reviewer@dut.udn.vn',
            passwordHash: await argon2.hash('Password123'),
            fullName: 'Reviewer Liên Chi Đoàn',
            role: 'LCD',
            organizationId: schoolUnion.id,
            status: 'ACTIVE',
        },
    })

    const orgAdmin = await prisma.operatorAccount.upsert({
        where: { email: 'clb.lcdcntt@dut.udn.vn' },
        update: {
            organizationId: facultyUnion.id,
            facultyId: faculty.id,
            fullName: 'CLB Liên Chi Đoàn CNTT',
            role: 'CLB',
            status: 'ACTIVE',
        },
        create: {
            email: 'clb.lcdcntt@dut.udn.vn',
            passwordHash: await argon2.hash('Password123'),
            fullName: 'CLB Liên Chi Đoàn CNTT',
            role: 'CLB',
            organizationId: facultyUnion.id,
            facultyId: faculty.id,
            status: 'ACTIVE',
        },
    })

    const certificateTemplate = await prisma.certificateTemplate.findFirst({
        where: { name: 'Volunteer MVP Certificate' },
    })

    if (!certificateTemplate) {
        await prisma.certificateTemplate.create({
            data: {
                name: 'Volunteer MVP Certificate',
                type: 'VOLUNTEER',
                layoutJson: {
                    version: 1,
                    fields: ['student_name', 'campaign_title', 'issued_at'],
                },
                createdBy: schoolAdmin.id,
            },
        })
    }

    const now = new Date()
    const campaign = await prisma.campaign.upsert({
        where: { slug: 'mvp-chien-dich-thien-nguyen' },
        update: {
            organizationId: facultyUnion.id,
            facultyId: faculty.id,
            createdBy: orgAdmin.id,
            status: 'ONGOING',
            publishedAt: now,
        },
        create: {
            organizationId: facultyUnion.id,
            title: 'MVP Chien dich thien nguyen',
            slug: 'mvp-chien-dich-thien-nguyen',
            summary: 'Chien dich mau de kiem thu contract Campaign container va campaign_modules',
            description: 'Fixture nay dung cho seed va smoke test API theo contract moi.',
            beneficiary: 'Cong dong dia phuong',
            scopeType: 'FACULTY',
            facultyId: faculty.id,
            startAt: now,
            endAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
            status: 'ONGOING',
            publishedAt: now,
            createdBy: orgAdmin.id,
        },
    })

    const moduleWindow = {
        startAt: now,
        endAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    }

    const fundraisingModule = await prisma.campaignModule.findFirst({
        where: { campaignId: campaign.id, type: 'fundraising' },
    })

    if (!fundraisingModule) {
        await prisma.campaignModule.create({
            data: {
                campaignId: campaign.id,
                type: 'fundraising',
                title: 'Gay quy hien kim',
                description: 'Module fundraising theo contract moi',
                ...moduleWindow,
                status: 'OPEN',
                settingsJson: {
                    target_amount: 10000000,
                    currency: 'VND',
                    sepay_enabled: true,
                },
            },
        })
    }

    const itemModule = await prisma.campaignModule.findFirst({
        where: { campaignId: campaign.id, type: 'item_donation' },
    })

    if (!itemModule) {
        const createdItemModule = await prisma.campaignModule.create({
            data: {
                campaignId: campaign.id,
                type: 'item_donation',
                title: 'Quyen gop hien vat',
                description: 'Nhan sach vo, dung cu hoc tap va nhu yeu pham.',
                ...moduleWindow,
                status: 'OPEN',
                settingsJson: {
                    receiver_address: 'Khu F, Dai hoc Bach khoa',
                    receiver_contact: 'clb.lcdcntt@dut.udn.vn',
                    allow_over_target: false,
                },
            },
        })

        await prisma.itemTarget.createMany({
            data: [
                {
                    campaignId: campaign.id,
                    moduleId: createdItemModule.id,
                    name: 'Vo ghi',
                    unit: 'quyen',
                    targetQuantity: 200,
                    description: 'Vo moi hoac con su dung tot.',
                },
                {
                    campaignId: campaign.id,
                    moduleId: createdItemModule.id,
                    name: 'But viet',
                    unit: 'cay',
                    targetQuantity: 300,
                    description: 'But bi hoac but muc.',
                },
            ],
        })
    }

    const eventModule = await prisma.campaignModule.findFirst({
        where: { campaignId: campaign.id, type: 'event' },
    })

    if (!eventModule) {
        await prisma.campaignModule.create({
            data: {
                campaignId: campaign.id,
                type: 'event',
                title: 'Ngay tinh nguyen tai dia phuong',
                description: 'Tuyen tinh nguyen vien ho tro trao qua va sinh hoat cong dong.',
                ...moduleWindow,
                status: 'OPEN',
                settingsJson: {
                    location: 'Phuong Hoa Khanh Bac',
                    quota: 50,
                    registration_required: true,
                    checkin_required: true,
                    benefits: ['Ghi nhan gio tinh nguyen', 'Cap chung nhan sau chien dich'],
                },
            },
        })
    }

    console.log('Seeded contract organizations and campaign fixtures')
}
