import { Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiResponse } from 'src/utils/ApiResponse'
import { ApiError } from 'src/utils/ApiError'
import * as studentService from './student.service'
import { EmptyBody, TypedRequest } from 'src/types/request'
import {
    StudentActivityQuery,
    StudentDonationQuery,
    UpdateProfileInput,
} from './types'

const requireStudentPrincipal = (req: {
    payload?: { userId?: string; accountType?: string }
}) => {
    const userId = req.payload?.userId
    const accountType = req.payload?.accountType

    if (!userId || accountType !== 'STUDENT') {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chưa xác thực người dùng')
    }

    return userId
}

export const getMe = catchAsync(async (req, res: Response) => {
    const userId = requireStudentPrincipal(req)

    const profile = await studentService.getMyProfile(userId)
    return ApiResponse.success(res, profile)
})

export const getMyDashboard = catchAsync(async (req, res: Response) => {
    const userId = requireStudentPrincipal(req)
    const dashboard = await studentService.getMyDashboard(userId)
    return ApiResponse.success(res, dashboard)
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
    const userId = requireStudentPrincipal(req)

    const titles = await studentService.getMyTitles(userId)
    return ApiResponse.success(res, titles)
})

export const getMyCertificates = catchAsync(async (req, res: Response) => {
    const userId = requireStudentPrincipal(req)

    const certificates = await studentService.getMyCertificates(userId)
    return ApiResponse.success(res, certificates)
})

export const getMyActivities = catchAsync(
    async (
        req: TypedRequest<EmptyBody, StudentActivityQuery>,
        res: Response
    ) => {
        const userId = requireStudentPrincipal(req)
        const activities = await studentService.getMyActivities(userId, req.query)
        return ApiResponse.success(res, activities)
    }
)

export const getMyDonations = catchAsync(async (req, res: Response) => {
    const userId = requireStudentPrincipal(req)
    const donations = await studentService.getMyDonations(
        userId,
        req.query as StudentDonationQuery
    )
    return ApiResponse.success(res, donations)
})

export const getStudentById = catchAsync(async (req, res: Response) => {
    const id = req.params.id as string

    const student = await studentService.getStudentById(id)
    return ApiResponse.success(res, student)
})
