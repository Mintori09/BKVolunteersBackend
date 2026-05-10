import * as studentRepo from './student.repository'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import {
    StudentProfile,
    UpdateProfileInput,
    StudentTitleDetail,
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
