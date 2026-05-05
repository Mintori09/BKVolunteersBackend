import { Response, Request } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiResponse } from 'src/utils/ApiResponse'
import { catchAsync } from 'src/utils/catchAsync'
import * as userService from './user.service'
import { CreateUserInput } from './types'

export const createUser = catchAsync(async (req: Request, res: Response) => {
    const user = await userService.createUser(req.body as CreateUserInput, {
        userId: req.payload?.userId,
        role: req.payload?.role as any,
    })

    return ApiResponse.success(
        res,
        user,
        'Tạo tài khoản thành công',
        HttpStatus.CREATED
    )
})
