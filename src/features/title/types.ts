import { Title } from '@prisma/client'
import { PaginatedResult } from '../gamification/types'

export interface CreateTitleInput {
    name: string
    description?: string
    minPoints: number
    iconUrl?: string
    badgeColor?: string
}

export interface UpdateTitleInput {
    name?: string
    description?: string
    minPoints?: number
    iconUrl?: string
    badgeColor?: string
    isActive?: boolean
}

export interface TitleFilter {
    isActive?: boolean
    page?: number
    limit?: number
}

export interface TitleDetail extends Title {}

export type TitlesListOutput = PaginatedResult<TitleDetail>
