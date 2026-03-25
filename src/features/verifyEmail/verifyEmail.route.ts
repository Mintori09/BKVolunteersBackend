import { Router } from 'express'
import * as verifyEmailController from './verifyEmail.controller'
import {
    sendVerifyEmailSchema,
    verifyEmailSchema,
} from './verifyEmail.validation'
import validate from 'src/common/middleware/validate'

const verifyEmailRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Verify Email
 *   description: Email verification management
 */

/**
 * @openapi
 * /verify-email/send-verification-email:
 *   post:
 *     summary: Send a verification email to the user
 *     tags: [Verify Email]
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
 *       400:
 *         description: Bad Request
 *       404:
 *         description: Not Found
 *       409:
 *         description: Conflict
 */
verifyEmailRouter.post(
    '/send-verification-email',
    validate(sendVerifyEmailSchema),
    verifyEmailController.sendVerificationEmail
)

/**
 * @openapi
 * /verify-email/{token}:
 *   get:
 *     summary: Verify user email using token
 *     tags: [Verify Email]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Verification token
 *     responses:
 *       200:
 *         description: OK (Returns HTML)
 *       400:
 *         description: Bad Request
 *       410:
 *         description: Gone (Link expired)
 */
verifyEmailRouter.get(
    '/:token',
    validate(verifyEmailSchema),
    verifyEmailController.handleVerifyEmail
)

export default verifyEmailRouter
