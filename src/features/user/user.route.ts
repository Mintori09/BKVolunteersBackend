import { Router } from 'express'
import { isAuth, restrictTo, validate } from 'src/common/middleware'
import * as userController from './user.controller'
import { createUserSchema } from './user.validation'

const userRouter = Router()

/**
 * @openapi
 * tags:
 *   name: User
 *   description: Internal account provisioning
 */

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Create user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [CLB, LCD, DOANTRUONG]
 *               facultyId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserOutput'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Conflict
 */

userRouter.post(
    '/',
    isAuth,
    restrictTo('DOANTRUONG'),
    validate(createUserSchema),
    userController.createUser
)

export default userRouter
