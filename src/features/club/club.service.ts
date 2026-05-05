import * as clubRepo from './club.repository'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import { CreateClubInput, UpdateClubInput, ClubFilter } from './types'

export const createClub = async (data: CreateClubInput) => {
    if (data.leaderId) {
        const leader = await clubRepo.findById(data.leaderId)
        if (!leader) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Không tìm thấy người dùng làm trưởng CLB'
            )
        }
    }

    return clubRepo.create(data)
}

export const updateClub = async (id: string, data: UpdateClubInput) => {
    const existing = await clubRepo.findById(id)
    if (!existing) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy CLB')
    }

    return clubRepo.updateById(id, data)
}

export const deleteClub = async (id: string) => {
    const existing = await clubRepo.findById(id)
    if (!existing) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy CLB')
    }

    return clubRepo.softDeleteById(id)
}

export const getAllClubs = async (query: ClubFilter) => {
    return clubRepo.findMany({
        page: query.page,
        limit: query.limit,
        facultyId: query.facultyId,
        search: query.search,
    })
}

export const getClubById = async (id: string) => {
    const club = await clubRepo.findById(id)
    if (!club) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy CLB')
    }
    return club
}
