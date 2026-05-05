import * as facultyRepo from './faculty.repository'
import { ApiError } from 'src/utils/ApiError'
import { HttpStatus } from 'src/common/constants'
import { CreateFacultyInput, UpdateFacultyInput, FacultyFilter } from './types'

export const createFaculty = async (data: CreateFacultyInput) => {
    const existingByCode = await facultyRepo.findByCode(data.code)
    if (existingByCode) {
        throw new ApiError(HttpStatus.CONFLICT, 'Mã khoa đã tồn tại')
    }

    return facultyRepo.create(data)
}

export const updateFaculty = async (id: number, data: UpdateFacultyInput) => {
    const existing = await facultyRepo.findById(id)
    if (!existing) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy khoa')
    }

    if (data.code && data.code !== existing.code) {
        const existingByCode = await facultyRepo.findByCode(data.code)
        if (existingByCode) {
            throw new ApiError(HttpStatus.CONFLICT, 'Mã khoa đã tồn tại')
        }
    }

    return facultyRepo.updateById(id, data)
}

export const deleteFaculty = async (id: number) => {
    const existing = await facultyRepo.findById(id)
    if (!existing) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy khoa')
    }

    const stats = await facultyRepo.findStatsById(id)
    if (stats.totalStudents > 0 || stats.totalUsers > 0) {
        throw new ApiError(
            HttpStatus.BAD_REQUEST,
            'Không thể xóa khoa đang có sinh viên hoặc người dùng'
        )
    }

    await facultyRepo.deleteById(id)
}

export const getAllFaculties = async (query: FacultyFilter) => {
    return facultyRepo.findMany({
        page: query.page,
        limit: query.limit,
        search: query.search,
    })
}

export const getFacultyById = async (id: number) => {
    const faculty = await facultyRepo.findById(id)
    if (!faculty) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy khoa')
    }
    return faculty
}

export const getFacultyByCode = async (code: string) => {
    const faculty = await facultyRepo.findByCode(code)
    if (!faculty) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy khoa')
    }
    return faculty
}

export const getFacultyStats = async (id: number) => {
    const faculty = await facultyRepo.findById(id)
    if (!faculty) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy khoa')
    }

    const stats = await facultyRepo.findStatsById(id)
    return {
        faculty,
        stats,
    }
}

export const getFacultiesList = async () => {
    return facultyRepo.findAll()
}
