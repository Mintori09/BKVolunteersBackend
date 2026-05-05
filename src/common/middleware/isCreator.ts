import type { NextFunction, Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'

const isCreator = (req: Request, res: Response, next: NextFunction) => {
    const role = req.payload?.role

    if (!role) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chưa xác thực người dùng')
    }

    if (role === 'SINHVIEN') {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Sinh viên không có quyền thực hiện thao tác này'
        )
    }

    next()
}

export default isCreator
