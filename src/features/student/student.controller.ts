import { Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiResponse } from 'src/utils/ApiResponse'
import { ApiError } from 'src/utils/ApiError'
import * as studentService from './student.service'
import { TypedRequest } from 'src/types/request'
import { UpdateProfileInput } from './types'

export const getMe = catchAsync(async (req, res: Response) => {
    const userId = req.payload?.userId
    const accountType = req.payload?.accountType

    if (!userId || accountType !== 'STUDENT') {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chưa xác thực người dùng')
    }

    const profile = await studentService.getMyProfile(userId)
    return ApiResponse.success(res, profile)
})

export const updateMe = catchAsync(
    async (req: TypedRequest<UpdateProfileInput>, res: Response) => {
        const userId = req.payload?.userId
        const accountType = req.payload?.accountType

        if (!userId || accountType !== 'STUDENT') {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Chưa xác thực người dùng'
            )
        }

        const updated = await studentService.updateMyProfile(userId, req.body)
        return ApiResponse.success(res, updated, 'Cập nhật thành công')
    }
)

export const getMyTitles = catchAsync(async (req, res: Response) => {
    const userId = req.payload?.userId
    const accountType = req.payload?.accountType

    if (!userId || accountType !== 'STUDENT') {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chưa xác thực người dùng')
    }

    const titles = await studentService.getMyTitles(userId)
    return ApiResponse.success(res, titles)
})

export const getStudentById = catchAsync(async (req, res: Response) => {
    const id = req.params.id as string

    const student = await studentService.getStudentById(id)
    return ApiResponse.success(res, student)
})
