import { Response } from 'express'
import { TypedRequest } from 'src/types/request'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiResponse } from 'src/utils/ApiResponse'
import { HttpStatus } from 'src/common/constants'
import * as passwordService from './password.service'
import type {
    ForgotPasswordInput,
    VerifyCodeInput,
    VerifyCodeOutput,
    ResetPasswordInput,
} from './types'

export const handleForgotPassword = catchAsync(
    async (req: TypedRequest<ForgotPasswordInput>, res: Response) => {
        const { email } = req.body
        await passwordService.forgotPassword(email!)
        return ApiResponse.success(
            res,
            null,
            'Mã xác thực đã được gửi đến email của bạn (nếu tài khoản tồn tại)',
        )
    },
)

export const handleVerifyCode = catchAsync(
    async (req: TypedRequest<VerifyCodeInput>, res: Response) => {
        const { email, code } = req.body
        const resetToken = await passwordService.verifyCode(email!, code!)
        return ApiResponse.success<VerifyCodeOutput>(
            res,
            { resetToken },
            'Xác thực thành công',
        )
    },
)

export const handleResetPassword = catchAsync(
    async (req: TypedRequest<ResetPasswordInput>, res: Response) => {
        const { resetToken, newPassword } = req.body
        await passwordService.resetPassword(resetToken!, newPassword!)
        return ApiResponse.success(
            res,
            null,
            'Mật khẩu đã được đặt lại thành công',
        )
    },
)
