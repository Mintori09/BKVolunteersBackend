import { Router } from 'express'
import { isAuth, validate } from 'src/common/middleware'
import * as notificationController from './notification.controller'
import {
    getMyNotificationsSchema,
    notificationIdSchema,
} from './notification.validation'

const notificationRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Notification
 *   description: Notification management
 */

/**
 * @openapi
 * /notifications/me:
 *   get:
 *     summary: List my notifications
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
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
 *                       $ref: '#/components/schemas/NotificationListOutput'
 *       401:
 *         description: Unauthorized
 */

notificationRouter.get(
    '/',
    isAuth,
    validate(getMyNotificationsSchema),
    notificationController.getMyNotifications
)

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark one notification as read
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                       $ref: '#/components/schemas/NotificationOutput'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */

notificationRouter.patch(
    '/:id/read',
    isAuth,
    validate(notificationIdSchema),
    notificationController.markAsRead
)

/**
 * @openapi
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notification]
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
 *                       $ref: '#/components/schemas/NotificationBatchUpdateOutput'
 *       401:
 *         description: Unauthorized
 */

notificationRouter.patch(
    '/read-all',
    isAuth,
    notificationController.markAllAsRead
)

export default notificationRouter
