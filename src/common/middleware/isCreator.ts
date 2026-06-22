import type { NextFunction, Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'

const isCreator = (req: Request, res: Response, next: NextFunction) => {
    const accountType = req.payload?.accountType

    if (!accountType) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chưa xác thực người dùng')
    }

    if (accountType === 'STUDENT') {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Sinh viên không có quyền thực hiện thao tác này'
        )
    }

    next()
}

export default isCreator
