import * as studentRepo from './student.repository'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import { serializeId } from 'src/common/serializers'
import {
    StudentProfile,
    UpdateProfileInput,
    StudentTitleDetail,
    StudentCertificateItem,
} from './types'

export const getMyProfile = async (
    studentId: string
): Promise<StudentProfile> => {
    const student = await studentRepo.findByIdWithTitles(studentId)

    if (!student) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
    }

    return {
        id: student.id.toString(),
        studentCode: student.studentCode,
        fullName: student.fullName,
        email: student.email,
        facultyId: student.facultyId.toString(),
        classCode: student.classCode,
        phone: student.phone,
        avatarUrl: student.avatarUrl,
        major: student.major,
        year: student.year,
        totalPoints: student.totalPoints,
        titles: student.currentTitle
            ? [
                  {
                      titleId: student.currentTitle.id.toString(),
                      name: student.currentTitle.name,
                      description: student.currentTitle.description,
                      minPoints: student.currentTitle.minPoints,
                      iconUrl: student.currentTitle.iconUrl,
                      badgeColor: null,
                      unlockedAt: null,
                  },
              ]
            : [],
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
    }
}

export const updateMyProfile = async (
    studentId: string,
    data: UpdateProfileInput
) => {
    const student = await studentRepo.findById(studentId)
    if (!student) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
    }

    return studentRepo.updateProfile(studentId, data)
}

export const getMyTitles = async (
    studentId: string
): Promise<StudentTitleDetail[]> => {
    const student = await studentRepo.findByIdWithTitles(studentId)

    if (!student) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
    }

    if (!student.currentTitle) {
        return []
    }

    return [
        {
            titleId: student.currentTitle.id.toString(),
            name: student.currentTitle.name,
            description: student.currentTitle.description,
            minPoints: student.currentTitle.minPoints,
            iconUrl: student.currentTitle.iconUrl,
            badgeColor: null,
            unlockedAt: null,
        },
    ]
}

export const getMyCertificates = async (
    studentId: string
): Promise<StudentCertificateItem[]> => {
    const certificates = await studentRepo.findCertificatesByStudentId(
        studentId
    )

    return certificates.map((cert) => ({
        id: cert.id.toString(),
        certificateNo: cert.certificateNo,
        campaignId: cert.campaignId.toString(),
        campaignTitle: cert.campaign.title,
        moduleTitle: cert.module?.title ?? null,
        templateName: cert.template.name,
        status: cert.status,
        fileUrl: cert.fileUrl,
        issuedAt: cert.issuedAt?.toISOString() ?? null,
        revokedAt: cert.revokedAt?.toISOString() ?? null,
        createdAt: cert.createdAt.toISOString(),
    }))
}

export const getMyDonations = async (studentId: string) => {
    const { moneyDonations, itemPledges } =
        await studentRepo.findDonationsByStudentId(studentId)

    const moneyItems = moneyDonations.map((d) => ({
        id: serializeId(d.id)!.toString(),
        donation_type: 'money' as const,
        reference_id: serializeId(d.id)!.toString(),
        campaign_id: serializeId(d.campaignId)!.toString(),
        campaign_title: d.campaign.title,
        campaign_slug: d.campaign.slug,
        module_id: serializeId(d.moduleId)!.toString(),
        module_title: d.module.title,
        status: d.status,
        occurred_at: d.createdAt.toISOString(),
        meta: {
            amount: Number(d.amount),
            donor_name: d.donorName,
            message: d.message,
        },
    }))

    const itemItems = itemPledges.map((p) => ({
        id: serializeId(p.id)!.toString(),
        donation_type: 'item' as const,
        reference_id: serializeId(p.id)!.toString(),
        campaign_id: serializeId(p.campaignId)!.toString(),
        campaign_title: p.campaign.title,
        campaign_slug: p.campaign.slug,
        module_id: serializeId(p.moduleId)!.toString(),
        module_title: p.module.title,
        status: p.status,
        occurred_at: p.createdAt.toISOString(),
        meta: {
            quantity: p.quantity,
            item_name: p.itemTarget.name,
            unit: p.itemTarget.unit,
            donor_name: p.donorName,
        },
    }))

    const all = [...moneyItems, ...itemItems].sort(
        (a, b) =>
            new Date(b.occurred_at).getTime() -
            new Date(a.occurred_at).getTime()
    )
    return all
}

export const getStudentById = async (studentId: string) => {
    const student = await studentRepo.findByIdPublic(studentId)

    if (!student) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
    }

    return {
        id: student.id.toString(),
        studentCode: student.studentCode,
        fullName: student.fullName,
        email: student.email,
        facultyId: student.facultyId.toString(),
        classCode: student.classCode,
        totalPoints: student.totalPoints,
        titles: student.currentTitle
            ? [
                  {
                      titleId: student.currentTitle.id.toString(),
                      name: student.currentTitle.name,
                      minPoints: student.currentTitle.minPoints,
                      iconUrl: student.currentTitle.iconUrl,
                      unlockedAt: null,
                  },
              ]
            : [],
    }
}
