import { Club } from '@prisma/client'
import { PaginatedResult } from '../gamification/types'

export interface CreateClubInput {
    name: string
    facultyId?: number
    leaderId?: string
}

export interface UpdateClubInput {
    name?: string
    facultyId?: number | null
    leaderId?: string | null
}

export interface ClubFilter {
    page?: number
    limit?: number
    facultyId?: number
    search?: string
}

export interface ClubDetail extends Club {
    faculty?: {
        id: number
        code: string
        name: string
    } | null
    leader?: {
        id: string
        username: string
        email: string
    } | null
}

export type ClubListOutput = PaginatedResult<ClubDetail>
