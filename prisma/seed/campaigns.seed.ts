import { PrismaClient } from '@prisma/client'

export const seedCampaigns = async (prisma: PrismaClient) => {
    const org = await prisma.organization.findUnique({ where: { code: 'BKV-IT' } })
    const operator = await prisma.operatorAccount.findUnique({
        where: { email: 'clb.cntt@dut.udn.vn' },
    })
    const student = await prisma.student.findUnique({
        where: { studentCode: '102210001' },
    })

    if (!org || !operator || !student) {
        throw new Error('Campaign seed prerequisite missing')
    }

    const campaign = await prisma.campaign.upsert({
        where: { slug: 'pilot-canonical-campaign' },
        update: {},
        create: {
            organizationId: org.id,
            title: 'Pilot Canonical Campaign',
            slug: 'pilot-canonical-campaign',
            summary: 'Demo campaign for pilot reset',
            description: 'Canonical demo campaign with fundraising and event modules',
            scopeType: 'FACULTY',
            facultyId: org.facultyId,
            startAt: new Date(),
            endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: 'PUBLISHED',
            publishedAt: new Date(),
            createdBy: operator.id,
        },
    })

    const fundraising = await prisma.campaignModule.upsert({
        where: { id: 1n },
        update: {},
        create: {
            campaignId: campaign.id,
            type: 'fundraising',
            title: 'Demo Fundraising',
            startAt: new Date(),
            endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: 'OPEN',
            settingsJson: { target_amount: 5000000, bank_account: '123456789' },
        },
    })

    const eventModule = await prisma.campaignModule.upsert({
        where: { id: 2n },
        update: {},
        create: {
            campaignId: campaign.id,
            type: 'event',
            title: 'Demo Event',
            startAt: new Date(),
            endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'OPEN',
            settingsJson: { max_participants: 100, location: 'Campus Hall' },
        },
    })

    await prisma.moneyDonation.createMany({
        data: [
            {
                campaignId: campaign.id,
                moduleId: fundraising.id,
                studentId: student.id,
                donorName: student.fullName,
                amount: '250000',
                status: 'VERIFIED',
                verifiedAt: new Date(),
            },
        ],
        skipDuplicates: true,
    })

    await prisma.eventRegistration.upsert({
        where: {
            moduleId_studentId: {
                moduleId: eventModule.id,
                studentId: student.id,
            },
        },
        update: {},
        create: {
            campaignId: campaign.id,
            moduleId: eventModule.id,
            studentId: student.id,
            status: 'APPROVED',
        },
    })
}

