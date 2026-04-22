import type { NextFunction, Request, Response } from 'express'
import { HttpStatus } from 'src/common/constants'
import { ApiError } from 'src/utils/ApiError'

const isStudent = (req: Request, res: Response, next: NextFunction) => {
    const role = req.payload?.role

    if (!role) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, 'Chưa xác thực người dùng')
    }

    if (role !== 'SINHVIEN') {
        throw new ApiError(
            HttpStatus.FORBIDDEN,
            'Chỉ sinh viên mới có thể thực hiện thao tác này'
        )
    }

    next()
}

export default isStudent
