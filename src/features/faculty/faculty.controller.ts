import { Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiResponse } from 'src/utils/ApiResponse'
import * as facultyService from './faculty.service'
import { CreateFacultyInput, UpdateFacultyInput } from './types'

export const createFaculty = catchAsync(async (req, res: Response) => {
    const data = req.body as CreateFacultyInput
    const faculty = await facultyService.createFaculty(data)

    return ApiResponse.success(
        res,
        faculty,
        'Tạo khoa thành công',
        HttpStatus.CREATED
    )
})

export const updateFaculty = catchAsync(async (req, res: Response) => {
    const id = parseInt(req.params.id as string, 10)
    const data = req.body as UpdateFacultyInput

    const faculty = await facultyService.updateFaculty(id, data)
    return ApiResponse.success(res, faculty, 'Cập nhật khoa thành công')
})

export const deleteFaculty = catchAsync(async (req, res: Response) => {
    const id = parseInt(req.params.id as string, 10)

    await facultyService.deleteFaculty(id)
    return ApiResponse.success(res, null, 'Xóa khoa thành công')
})

export const getAllFaculties = catchAsync(async (req, res: Response) => {
    const { page, limit, search } = req.query as any

    const faculties = await facultyService.getAllFaculties({
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        search: search as string | undefined,
    })

    return ApiResponse.success(res, faculties)
})

export const getFacultyById = catchAsync(async (req, res: Response) => {
    const id = parseInt(req.params.id as string, 10)

    const faculty = await facultyService.getFacultyById(id)
    return ApiResponse.success(res, faculty)
})

export const getFacultyByCode = catchAsync(async (req, res: Response) => {
    const code = req.params.code as string

    const faculty = await facultyService.getFacultyByCode(code)
    return ApiResponse.success(res, faculty)
})

export const getFacultyStats = catchAsync(async (req, res: Response) => {
    const id = parseInt(req.params.id as string, 10)

    const result = await facultyService.getFacultyStats(id)
    return ApiResponse.success(res, result)
})

export const getFacultiesList = catchAsync(async (req, res: Response) => {
    const faculties = await facultyService.getFacultiesList()
    return ApiResponse.success(res, faculties)
})
