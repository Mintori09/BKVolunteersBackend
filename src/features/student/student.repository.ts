import { prismaClient } from 'src/config'
import { UpdateProfileInput } from './types'

const toBigIntId = (id: string) => BigInt(id)

export const findById = async (id: string) => {
    return prismaClient.student.findUnique({
        where: { id: toBigIntId(id) },
        include: {
            currentTitle: true,
        },
    })
}

export const findByIdWithTitles = async (id: string) => {
    return prismaClient.student.findUnique({
        where: { id: toBigIntId(id) },
        select: {
            id: true,
            studentCode: true,
            fullName: true,
            email: true,
            facultyId: true,
            classCode: true,
            phone: true,
            avatarUrl: true,
            major: true,
            year: true,
            totalPoints: true,
            createdAt: true,
            updatedAt: true,
            currentTitle: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    minPoints: true,
                    iconUrl: true,
                },
            },
        },
    })
}

export const findByIdPublic = async (id: string) => {
    return prismaClient.student.findUnique({
        where: { id: toBigIntId(id) },
        select: {
            id: true,
            studentCode: true,
            fullName: true,
            email: true,
            facultyId: true,
            classCode: true,
            totalPoints: true,
            createdAt: true,
            updatedAt: true,
            currentTitle: {
                select: {
                    id: true,
                    name: true,
                    minPoints: true,
                    iconUrl: true,
                },
            },
        },
    })
}

export const findDonationsByStudentId = async (studentId: string) => {
    const id = toBigIntId(studentId)
    const [moneyDonations, itemPledges] = await Promise.all([
        prismaClient.moneyDonation.findMany({
            where: { studentId: id },
            include: {
                campaign: { select: { id: true, title: true, slug: true } },
                module: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prismaClient.itemPledge.findMany({
            where: { studentId: id },
            include: {
                campaign: { select: { id: true, title: true, slug: true } },
                module: { select: { id: true, title: true } },
                itemTarget: { select: { id: true, name: true, unit: true } },
            },
            orderBy: { createdAt: 'desc' },
        }),
    ])
    return { moneyDonations, itemPledges }
}

export const findCertificatesByStudentId = async (studentId: string) => {
    return prismaClient.certificate.findMany({
        where: { studentId: toBigIntId(studentId) },
        include: {
            campaign: { select: { title: true } },
            module: { select: { title: true } },
            template: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
    })
}

export const updateProfile = async (id: string, data: UpdateProfileInput) => {
    return prismaClient.student.update({
        where: { id: toBigIntId(id) },
        data: {
            phone: data.phone,
            classCode: data.classCode,
            avatarUrl: data.avatarUrl,
            major: data.major,
            year: data.year,
        },
        select: {
            id: true,
            studentCode: true,
            fullName: true,
            email: true,
            facultyId: true,
            classCode: true,
            phone: true,
            avatarUrl: true,
            major: true,
            year: true,
            totalPoints: true,
        },
    })
}
