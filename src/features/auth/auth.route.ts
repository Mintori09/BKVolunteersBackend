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
 * components:
 *   schemas:
 *     LoginRequestBody:
 *       type: object
 *       required: [identifier, password]
 *       properties:
 *         identifier:
 *           type: string
 *           description: Email hoặc MSSV
 *           example: 102210001
 *         password:
 *           type: string
 *           format: password
 *           example: secret123
 *     LoginOutput:
 *       type: object
 *       required: [accessToken]
 *       properties:
 *         accessToken:
 *           type: string
 *           example: jwt-access-token
 *         refreshToken:
 *           type: string
 *           nullable: true
 *           example: refresh-token
 *     MeOrganizationOutput:
 *       type: object
 *       required: [id, name, type]
 *       properties:
 *         id: { type: integer, example: 5 }
 *         name: { type: string, example: "CLB Tinh nguyen CNTT" }
 *         type: { type: string, example: "club" }
 *     MeFacultyOutput:
 *       type: object
 *       required: [id, code, name]
 *       properties:
 *         id: { type: integer, example: 2 }
 *         code: { type: string, example: "CNTT" }
 *         name: { type: string, example: "Cong nghe thong tin" }
 *     StudentProfileOutput:
 *       type: object
 *       required: [id, student_code, full_name, email]
 *       properties:
 *         id: { type: integer, example: 42 }
 *         student_code: { type: string, example: "102210001" }
 *         full_name: { type: string, example: "Nguyen Van A" }
 *         email: { type: string, example: "student@dut.udn.vn" }
 *         class_code: { type: string, nullable: true, example: "22TCLC_DT1" }
 *     OperatorProfileOutput:
 *       type: object
 *       required: [id, full_name, email]
 *       properties:
 *         id: { type: integer, example: 7 }
 *         full_name: { type: string, example: "Tran Thi B" }
 *         email: { type: string, example: "operator@dut.udn.vn" }
 *     MeOutput:
 *       type: object
 *       required: [account_type, role, organization, faculty]
 *       properties:
 *         account_type: { type: string, enum: [STUDENT, OPERATOR] }
 *         role: { type: string, enum: [SINHVIEN, CLB, LCD, DOANTRUONG] }
 *         organization:
 *           oneOf:
 *             - $ref: '#/components/schemas/MeOrganizationOutput'
 *             - type: 'null'
 *         faculty:
 *           oneOf:
 *             - $ref: '#/components/schemas/MeFacultyOutput'
 *             - type: 'null'
 *         student:
 *           oneOf:
 *             - $ref: '#/components/schemas/StudentProfileOutput'
 *             - type: 'null'
 *         operator:
 *           oneOf:
 *             - $ref: '#/components/schemas/OperatorProfileOutput'
 *             - type: 'null'
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequestBody'
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
authRouter.post('/logout', validate(logoutSchema), authController.handleLogout)

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
authRouter.post(
    '/refresh',
    validate(refreshSchema),
    authController.handleRefresh
)

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
 *                       $ref: '#/components/schemas/MeOutput'
 *       401:
 *         description: Unauthorized
 */
authRouter.get('/microsoft/login', authController.handleMicrosoftLogin)
authRouter.get('/microsoft/callback', authController.handleMicrosoftCallback)
authRouter.get('/microsoft/mock-callback', authController.handleMicrosoftMockCallback)

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
