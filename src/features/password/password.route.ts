import { Router } from 'express'
import { validate } from 'src/common/middleware'
import * as passwordController from './password.controller'
import {
    forgotPasswordSchema,
    verifyCodeSchema,
    resetPasswordSchema,
} from './password.validation'

const passwordRouter = Router()

passwordRouter.post(
    '/forgot-password',
    validate(forgotPasswordSchema),
    passwordController.handleForgotPassword,
)

passwordRouter.post(
    '/verify-code',
    validate(verifyCodeSchema),
    passwordController.handleVerifyCode,
)

passwordRouter.post(
    '/reset-password',
    validate(resetPasswordSchema),
    passwordController.handleResetPassword,
)

export default passwordRouter
