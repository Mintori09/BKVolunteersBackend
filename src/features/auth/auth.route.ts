import { Router } from 'express'
import validate from 'src/common/middleware/validate'
import {
    changePasswordSchema,
    loginSchema,
    logoutSchema,
    refreshSchema,
} from './auth.validation'

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
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 format: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LoginOutput'
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
authRouter.post(
    '/logout',
    validate(logoutSchema),
    authController.handleLogout
)

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LoginOutput'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
authRouter.post('/refresh', validate(refreshSchema), authController.handleRefresh)

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
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       nullable: true
 *       401:
 *         description: Unauthorized
 */
authRouter.get('/me', isAuth, authController.getMe)

/**
 * @openapi
 * /auth/me/password:
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
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       nullable: true
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 */
authRouter.patch(
    '/me/password',
    isAuth,
    validate(changePasswordSchema),
    authController.handleChangePassword
)

export default authRouter
