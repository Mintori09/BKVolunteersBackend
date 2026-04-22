import { Faculty } from '@prisma/client'
import { PaginatedResult } from '../gamification/types'

export interface CreateFacultyInput {
    code: string
    name: string
}

export interface UpdateFacultyInput {
    code?: string
    name?: string
}

export interface FacultyFilter {
    page?: number
    limit?: number
    search?: string
}

export interface FacultyDetail extends Faculty {}

export type FacultyListOutput = PaginatedResult<FacultyDetail>

export interface FacultyStats {
    totalStudents: number
    totalUsers: number
    totalClubs: number
    totalPoints: number
}
