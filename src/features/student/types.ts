import { PaginatedResult } from 'src/common/types'

export interface UpdateProfileInput {
    phone?: string
    classCode?: string
    avatarUrl?: string
    major?: string
    year?: number
}

export interface StudentProfile {
    id: string
    studentCode: string
    fullName: string
    email: string
    facultyId: string
    classCode: string | null
    phone: string | null
    avatarUrl: string | null
    major: string | null
    year: number | null
    totalPoints: number
    titles: StudentTitleDetail[]
    createdAt: Date
    updatedAt: Date
}

export interface StudentTitleDetail {
    titleId: string
    name: string
    description: string | null
    minPoints: number
    iconUrl: string | null
    badgeColor: string | null
    unlockedAt: Date | null
}

export interface PointHistoryItem {
    id: string
    points: number
    reason: string
    sourceType: string
    sourceId: string | null
    createdAt: Date
}

export type PointsHistoryOutput = PaginatedResult<PointHistoryItem>
