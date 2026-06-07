import { Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'
import { TypedRequest } from 'src/types/request'
import {
    CreateUserInput,
    UpdateUserInput,
    UpdateUserStatusInput,
    UsersQueryInput,
} from './types'
import * as usersService from './users.service'

const getParamAsString = (value: string | string[] | undefined) =>
    typeof value === 'string' ? value : undefined

export const listUsers = catchAsync(
    async (
        req: TypedRequest<Record<string, never>, UsersQueryInput>,
        res: Response
    ) => {
        const result = await usersService.listUsers(
            req.query as UsersQueryInput
        )
        return ApiResponse.success(res, result)
    }
)

export const getUserOptions = catchAsync(
    async (_req: Request, res: Response) => {
        const result = await usersService.getUserOptions()
        return ApiResponse.success(res, result)
    }
)

export const createUser = catchAsync(
    async (req: TypedRequest<CreateUserInput>, res: Response) => {
        const created = await usersService.createUser(
            req.body as CreateUserInput
        )
        return ApiResponse.success(
            res,
            created,
            'Tao tai khoan thanh cong',
            HttpStatus.CREATED
        )
    }
)

export const updateUser = catchAsync(
    async (req: TypedRequest<UpdateUserInput>, res: Response) => {
        const userId = getParamAsString(
            (req.params as Record<string, unknown>).userId as
                | string
                | string[]
                | undefined
        )
        if (!userId) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Thieu userId')
        }

        const updated = await usersService.updateUser(
            userId,
            req.body as UpdateUserInput
        )
        return ApiResponse.success(
            res,
            updated,
            'Cap nhat tai khoan thanh cong'
        )
    }
)

export const updateUserStatus = catchAsync(
    async (req: TypedRequest<UpdateUserStatusInput>, res: Response) => {
        const userId = getParamAsString(
            (req.params as Record<string, unknown>).userId as
                | string
                | string[]
                | undefined
        )
        const actorUserId = req.payload?.userId

        if (!userId || !actorUserId) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Thieu thong tin tai khoan'
            )
        }

        const updated = await usersService.updateUserStatus(
            userId,
            req.body as UpdateUserStatusInput,
            actorUserId
        )
        return ApiResponse.success(
            res,
            updated,
            'Cap nhat trang thai thanh cong'
        )
    }
)

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
    const userId = getParamAsString(
        (req.params as Record<string, unknown>).userId as
            | string
            | string[]
            | undefined
    )
    const actorUserId = req.payload?.userId

    if (!userId || !actorUserId) {
        throw new ApiError(HttpStatus.BAD_REQUEST, 'Thieu thong tin tai khoan')
    }

    await usersService.deleteUser(userId, actorUserId)
    return ApiResponse.success(res, null, 'Xoa tai khoan thanh cong')
})
