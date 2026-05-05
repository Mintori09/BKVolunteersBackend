import {
    PaginatedResult,
    PaginationQuery,
    PointTransactionFilter,
} from '../gamification/types'
import { Student, StudentTitle, Title, PointTransaction } from '@prisma/client'

export interface UpdateProfileInput {
    phone?: string
    className?: string
}

export interface StudentProfile {
    id: string
    mssv: string
    fullName: string
    email: string
    facultyId: string | null
    className: string | null
    phone: string | null
    totalPoints: number
    titles: StudentTitleDetail[]
    createdAt: Date
    updatedAt: Date
}

export interface StudentTitleDetail {
    titleId: number
    name: string
    description: string | null
    minPoints: number
    iconUrl: string | null
    badgeColor: string | null
    unlockedAt: Date
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
