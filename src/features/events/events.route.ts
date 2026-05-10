import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import validate from 'src/common/middleware/validate'
import * as eventsController from './events.controller'
import {
    eventApproveSchema,
    eventModuleParamsSchema,
    eventRegisterSchema,
} from './events.validation'

const eventsRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Events
 *   description: Canonical event module endpoints
 * components:
 *   schemas:
 *     EventModuleOutput:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 31 }
 *         campaign_id: { type: integer, example: 7 }
 *         type: { type: string, example: EVENT }
 *         title: { type: string, example: Ngày hội hiến máu }
 *         description: { type: string, nullable: true }
 *         status: { type: string, example: ACTIVE }
 *         start_at: { type: string, format: date-time }
 *         end_at: { type: string, format: date-time }
 *         settings_json: { type: object, nullable: true }
 *         registration_count: { type: integer, example: 120 }
 *         approved_count: { type: integer, example: 90 }
 *         campaign:
 *           type: object
 *           properties:
 *             id: { type: integer, example: 7 }
 *             title: { type: string, example: Chiến dịch mùa hè xanh }
 *             slug: { type: string, example: chien-dich-mua-he-xanh }
 *             status: { type: string, example: ONGOING }
 *     EventRegisterBody:
 *       type: object
 *       properties:
 *         answers_json:
 *           type: object
 *           additionalProperties: true
 *     EventRegisterOutput:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 401 }
 *         status: { type: string, example: PENDING }
 *         module_id: { type: integer, example: 31 }
 *     EventApproveBody:
 *       type: object
 *       properties:
 *         note: { type: string, example: Đủ điều kiện tham gia }
 *     EventApproveOutput:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 401 }
 *         status: { type: string, example: APPROVED }
 */

/**
 * @openapi
 * /events/modules/{moduleId}:
 *   get:
 *     summary: Get event module
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Event module detail
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/EventModuleOutput'
 *       404:
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 */
eventsRouter.get(
    '/modules/:moduleId',
    validate(eventModuleParamsSchema),
    eventsController.getEventModule
)

/**
 * @openapi
 * /events/modules/{moduleId}/register:
 *   post:
 *     summary: Register for an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventRegisterBody'
 *     responses:
 *       201:
 *         description: Registration created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/EventRegisterOutput'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenError'
 */
eventsRouter.post(
    '/modules/:moduleId/register',
    isAuth,
    validate(eventRegisterSchema),
    eventsController.registerEvent
)

/**
 * @openapi
 * /events/registrations/{id}/approve:
 *   patch:
 *     summary: Approve event registration
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventApproveBody'
 *     responses:
 *       200:
 *         description: Registration approved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/EventApproveOutput'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenError'
 */
eventsRouter.patch(
    '/registrations/:id/approve',
    isAuth,
    validate(eventApproveSchema),
    eventsController.approveEventRegistration
)

export default eventsRouter
