import * as studentRepo from './student.repository'
import * as pointTransactionRepo from '../gamification/pointTransaction.repository'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import {
    StudentProfile,
    UpdateProfileInput,
    StudentTitleDetail,
    PointsHistoryOutput,
    PointHistoryItem,
} from './types'
import { PaginationQuery, PointTransactionFilter } from '../gamification/types'

export const getMyProfile = async (
    studentId: string
): Promise<StudentProfile> => {
    const student = await studentRepo.findByIdWithTitles(studentId)

    if (!student) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
    }

    return {
        id: student.id,
        mssv: student.mssv,
        fullName: student.fullName,
        email: student.email,
        facultyId: student.facultyId,
        className: student.className,
        phone: student.phone,
        totalPoints: student.totalPoints,
        titles: student.titles.map(
            (st): StudentTitleDetail => ({
                titleId: st.title.id,
                name: st.title.name,
                description: st.title.description,
                minPoints: st.title.minPoints,
                iconUrl: st.title.iconUrl,
                badgeColor: st.title.badgeColor,
                unlockedAt: st.unlockedAt,
            })
        ),
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

export const getPointsHistory = async (
    studentId: string,
    query: PaginationQuery & PointTransactionFilter
): Promise<PointsHistoryOutput> => {
    const page = query.page ?? 1
    const limit = query.limit ?? 10

    const result = await pointTransactionRepo.findManyByStudentId(
        studentId,
        {
            sourceType: query.sourceType,
            fromDate: query.fromDate,
            toDate: query.toDate,
        },
        page,
        limit
    )

    return {
        items: result.items.map(
            (pt): PointHistoryItem => ({
                id: pt.id,
                points: pt.points,
                reason: pt.reason,
                sourceType: pt.sourceType,
                sourceId: pt.sourceId,
                createdAt: pt.createdAt,
            })
        ),
        meta: result.meta,
    }
}

export const getMyTitles = async (
    studentId: string
): Promise<StudentTitleDetail[]> => {
    const student = await studentRepo.findByIdWithTitles(studentId)

    if (!student) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
    }

    return student.titles.map(
        (st): StudentTitleDetail => ({
            titleId: st.title.id,
            name: st.title.name,
            description: st.title.description,
            minPoints: st.title.minPoints,
            iconUrl: st.title.iconUrl,
            badgeColor: st.title.badgeColor,
            unlockedAt: st.unlockedAt,
        })
    )
}

export const getStudentById = async (studentId: string) => {
    const student = await studentRepo.findByIdPublic(studentId)

    if (!student) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy sinh viên')
    }

    return {
        id: student.id,
        mssv: student.mssv,
        fullName: student.fullName,
        email: student.email,
        facultyId: student.facultyId,
        className: student.className,
        totalPoints: student.totalPoints,
        titles: student.titles.map((st) => ({
            titleId: st.title.id,
            name: st.title.name,
            minPoints: st.title.minPoints,
            iconUrl: st.title.iconUrl,
            unlockedAt: st.unlockedAt,
        })),
    }
}
