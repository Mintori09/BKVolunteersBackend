import { Request, Response } from 'express'
import { EmailRequestBody } from 'src/types/common'
import { TypedRequest } from 'src/types/request'
import { HttpStatus } from 'src/common/constants'
import { config } from 'src/config'
import * as authService from 'src/features/auth/auth.service'
import * as verifyEmailService from './verifyEmail.service'
import { catchAsync } from 'src/utils/catchAsync'
import { ApiError } from 'src/utils/ApiError'
import { ApiResponse } from 'src/utils/ApiResponse'

export const sendVerificationEmail = catchAsync(
    async (req: TypedRequest<EmailRequestBody>, res: Response) => {
        const { email } = req.body

        if (!email) {
            throw new ApiError(HttpStatus.BAD_REQUEST, 'Email is required!')
        }

        const user = await authService.getUserByEmail(email)

        if (!user) {
            throw new ApiError(HttpStatus.NOT_FOUND, 'Email not found!')
        }

        if (user.emailVerified) {
            throw new ApiError(HttpStatus.CONFLICT, 'Email already verified!')
        }

        const existingToken = await verifyEmailService.getExistingValidToken(
            user.id
        )

        if (existingToken) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                'Verification email already sent!'
            )
        }

        await verifyEmailService.createVerificationToken(user.id, email)

        return ApiResponse.success(res, null, 'Verification email sent!')
    }
)

export const handleVerifyEmail = catchAsync(
    async (req: Request, res: Response) => {
        const { token } = req.params as { token: string }
        const loginUrl = `${config.cors.cors_origin}/login`

        const renderHtmlResponse = (
            title: string,
            message: string,
            isSuccess: boolean
        ) => `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f4f7f6; }
                    .container { text-align: center; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
                    h1 { color: ${isSuccess ? '#28a745' : '#dc3545'}; }
                    p { color: #666; margin-bottom: 30px; }
                    .btn { background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>${isSuccess ? 'Success!' : 'Oops!'}</h1>
                    <p>${message}</p>
                    <a href="${loginUrl}" class="btn">Go to Login</a>
                </div>
            </body>
            </html>
        `

        if (!token) {
            return res
                .status(HttpStatus.BAD_REQUEST)
                .send(
                    renderHtmlResponse(
                        'Verification Failed',
                        'Invalid verification link.',
                        false
                    )
                )
        }

        const verificationToken =
            await verifyEmailService.getVerificationToken(token)

        if (!verificationToken || verificationToken.expiresAt < new Date()) {
            return res
                .status(HttpStatus.GONE)
                .send(
                    renderHtmlResponse(
                        'Link Expired',
                        'This verification link is invalid or has expired.',
                        false
                    )
                )
        }

        await verifyEmailService.verifyUserEmail(verificationToken.userId)

        return res
            .status(HttpStatus.OK)
            .send(
                renderHtmlResponse(
                    'Email Verified',
                    'Your email has been successfully verified. You can now log in.',
                    true
                )
            )
    }
)
