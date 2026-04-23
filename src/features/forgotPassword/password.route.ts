import { Router } from 'express'
import validate from 'src/common/middleware/validate'
import * as forgotPasswordController from './forgotPassword.controller'
import {
    forgotPasswordSchema,
    resetPasswordSchema,
} from './password.validation'

const passwordRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Password
 *   description: Password management and recovery
 */

/**
 * @openapi
 * /password/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
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
 */
passwordRouter.post(
    '/forgot-password',
    validate(forgotPasswordSchema),
    forgotPasswordController.handleForgotPassword
)

/**
 * @openapi
 * /password/reset-password/{token}:
 *   post:
 *     summary: Reset password using token
 *     tags: [Password]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Reset password token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
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
 *       404:
 *         description: Not Found
 */
passwordRouter.post(
    '/reset-password/:token',
    validate(resetPasswordSchema),
    forgotPasswordController.handleResetPassword
)

export default passwordRouter
