import { Router } from 'express'
import validate from 'src/common/middleware/validate'
import { changePasswordSchema, loginSchema } from './auth.validation'

import * as authController from './auth.controller'
import isAuth from 'src/common/middleware/isAuth'

const authRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Authentication management
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mssv
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 */
authRouter.post('/login', validate(loginSchema), authController.handleLogin)

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: No Content
 *       401:
 *         description: Unauthorized
 */
authRouter.post('/logout', isAuth, authController.handleLogout)

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
authRouter.post('/refresh', authController.handleRefresh)

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 */
authRouter.get('/me', isAuth, authController.getMe)

/**
 * @openapi
 * /auth/change-password:
 *   patch:
 *     summary: Change password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - newPasswordConfirm
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *               newPasswordConfirm:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 */
authRouter.patch(
    '/change-password',
    isAuth,
    validate(changePasswordSchema),
    authController.handleChangePassword
)

export default authRouter
