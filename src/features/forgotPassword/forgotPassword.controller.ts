import { HttpStatus } from 'src/common/constants'
import {
    ForgotPasswordInput,
    ResetPasswordInput,
    ResetPasswordParams,
} from './types'
import { TypedRequest } from 'src/types/request'
import { Response } from 'express'
import * as authService from 'src/features/auth/auth.service'
import * as forgotPasswordService from './forgotPassword.service'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'

export const handleForgotPassword = catchAsync(
    async (
        req: TypedRequest<ForgotPasswordInput, ResetPasswordParams>,
        res: Response
    ) => {
        const { email } = req.body

        if (!email) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Email là bắt buộc!')
        }

        const user = await authService.getUserByEmail(email)

        if (!user) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Email không tồn tại trong hệ thống!'
            )
        }

        await forgotPasswordService.createResetToken(user.id, email)

        return ApiResponse.success(
            res,
            null,
            'Email đặt lại mật khẩu đã được gửi!'
        )
    }
)

export const handleResetPassword = catchAsync(
    async (
        req: TypedRequest<ResetPasswordInput, ResetPasswordParams>,
        res: Response
    ) => {
        const { token } = req.params
        const { newPassword } = req.body

        if (!token)
            throw new ApiError(HttpStatus.NOT_FOUND, 'Không tìm thấy token')

        if (!newPassword) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Mật khẩu mới là bắt buộc!'
            )
        }

        const resetToken = await forgotPasswordService.getResetToken(
            token as string
        )

        if (!resetToken) {
            throw new ApiError(
                HttpStatus.NOT_FOUND,
                'Token không hợp lệ hoặc đã hết hạn'
            )
        }

        await forgotPasswordService.resetUserPassword(
            resetToken.userId,
            newPassword
        )

        return ApiResponse.success(res, null, 'Đặt lại mật khẩu thành công!')
    }
)
