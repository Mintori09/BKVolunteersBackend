import { HttpStatus } from 'src/common/constants'
import { ResetPasswordRequestBodyType } from './types'
import { EmailRequestBody } from 'src/types/common'
import { TypedRequest } from 'src/types/request'
import { Response } from 'express'
import * as authService from 'src/features/auth/auth.service'
import * as forgotPasswordService from './forgotPassword.service'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'

export const handleForgotPassword = catchAsync(
    async (req: TypedRequest<EmailRequestBody>, res: Response) => {
        const { email } = req.body

        if (!email) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Email is required!')
        }

        const user = await authService.getUserByEmail(email)

        if (!user || !user.emailVerified) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                'Your email is not verified! Please confirm your email!'
            )
        }

        await forgotPasswordService.createResetToken(user.id, email)

        return ApiResponse.success(res, null, 'Password reset email sent!')
    }
)

export const handleResetPassword = catchAsync(
    async (req: TypedRequest<ResetPasswordRequestBodyType>, res: Response) => {
        const { token } = req.params
        const { newPassword } = req.body

        if (!token) throw new ApiError(HttpStatus.NOT_FOUND, 'Token not found')

        if (!newPassword) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'New password is required!'
            )
        }

        const resetToken = await forgotPasswordService.getResetToken(
            token as string
        )

        if (!resetToken) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Invalid or expired token')
        }

        await forgotPasswordService.resetUserPassword(
            resetToken.userId,
            newPassword
        )

        return ApiResponse.success(res, null, 'Password reset successful!')
    }
)
