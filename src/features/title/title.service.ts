import * as titleRepo from './title.repository'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import { CreateTitleInput, UpdateTitleInput, TitleFilter } from './types'

export const createTitle = async (data: CreateTitleInput) => {
    const existing = await titleRepo.findMany({ limit: 1 })
    const duplicateMinPoints = existing.items.find(
        (t) => t.minPoints === data.minPoints
    )
    if (duplicateMinPoints) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Đã tồn tại danh hiệu với mức điểm này'
        )
    }

    return titleRepo.create(data)
}

export const updateTitle = async (id: number, data: UpdateTitleInput) => {
    const existing = await titleRepo.findById(id)
    if (!existing) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy danh hiệu')
    }

    return titleRepo.updateById(id, data)
}

export const deleteTitle = async (id: number) => {
    const existing = await titleRepo.findById(id)
    if (!existing) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy danh hiệu')
    }

    await titleRepo.deleteById(id)
}

export const getAllTitles = async (query: TitleFilter) => {
    return titleRepo.findMany({
        page: query.page,
        limit: query.limit,
        isActive: query.isActive,
    })
}

export const getTitleById = async (id: number) => {
    const title = await titleRepo.findById(id)
    if (!title) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy danh hiệu')
    }
    return title
}
