import { Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiResponse } from 'src/utils/ApiResponse'
import * as clubService from './club.service'
import { CreateClubInput, UpdateClubInput } from './types'

export const createClub = catchAsync(async (req, res: Response) => {
    const data = req.body as CreateClubInput
    const club = await clubService.createClub(data)

    return ApiResponse.success(
        res,
        club,
        'Tạo CLB thành công',
        HttpStatus.CREATED
    )
})

export const updateClub = catchAsync(async (req, res: Response) => {
    const id = req.params.id as string
    const data = req.body as UpdateClubInput

    const club = await clubService.updateClub(id, data)
    return ApiResponse.success(res, club, 'Cập nhật CLB thành công')
})

export const deleteClub = catchAsync(async (req, res: Response) => {
    const id = req.params.id as string

    await clubService.deleteClub(id)
    return ApiResponse.success(res, null, 'Xóa CLB thành công')
})

export const getAllClubs = catchAsync(async (req, res: Response) => {
    const { page, limit, facultyId, search } = req.query as any

    const clubs = await clubService.getAllClubs({
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        facultyId: facultyId ? parseInt(facultyId, 10) : undefined,
        search: search as string | undefined,
    })

    return ApiResponse.success(res, clubs)
})

export const getClubById = catchAsync(async (req, res: Response) => {
    const id = req.params.id as string

    const club = await clubService.getClubById(id)
    return ApiResponse.success(res, club)
})
