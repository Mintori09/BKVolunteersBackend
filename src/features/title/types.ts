import { Title } from '@prisma/client'
import { PaginatedResult } from 'src/common/types'

export interface CreateTitleInput {
    name: string
    description?: string
    minPoints: number
    iconUrl?: string
}

export interface UpdateTitleInput {
    name?: string
    description?: string
    minPoints?: number
    iconUrl?: string
}

export interface TitleFilter {
    page?: number
    limit?: number
}

export interface TitleDetail extends Title {}

export type TitlesListOutput = PaginatedResult<TitleDetail>
