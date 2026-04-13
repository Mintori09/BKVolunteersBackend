import { Router } from 'express'
import validate from 'src/common/middleware/validate'
import {
    changePasswordSchema,
    loginSchema,
    managerLoginSchema,
    signupSchema,
} from './auth.validation'

import * as authController from './auth.controller'
import isAuth from 'src/common/middleware/isAuth'

const authRouter = Router()

authRouter.post('/signup', validate(signupSchema), authController.handleSignup)
authRouter.post('/login', validate(loginSchema), authController.handleLogin)
authRouter.post(
    '/manager/login',
    validate(managerLoginSchema),
    authController.handleManagerLogin
)
authRouter.post('/logout', isAuth, authController.handleLogout)
authRouter.post('/refresh', authController.handleRefresh)
authRouter.get('/me', isAuth, authController.getMe)
authRouter.patch(
    '/change-password',
    isAuth,
    validate(changePasswordSchema),
    authController.handleChangePassword
)

export default authRouter
