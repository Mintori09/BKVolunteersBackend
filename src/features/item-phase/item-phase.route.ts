import { Router } from 'express'
import validate from 'src/common/middleware/validate'
import { isAuth, isCreator } from 'src/common/middleware'
import {
    createItemPhaseSchema,
    updateItemPhaseSchema,
    deleteItemPhaseSchema,
    getItemPhaseByCampaignSchema,
} from './item-phase.validation'
import * as itemPhaseController from './item-phase.controller'

const itemPhaseRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Item Phase
 *   description: Quản lý giai đoạn quyên góp hiện vật
 */

/**
 * @openapi
 * /campaigns/{campaignId}/item-phases:
 *   post:
 *     summary: Tạo giai đoạn quyên góp hiện vật
 *     tags: [Item Phase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - acceptedItems
 *             properties:
 *               acceptedItems:
 *                 type: array
 *                 items:
 *                   type: string
 *               collectionAddress:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
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
 *                       $ref: '#/components/schemas/ItemPhaseOutput'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       409:
 *         description: Conflict
 */
itemPhaseRouter.post(
    '/',
    isAuth,
    isCreator,
    validate(createItemPhaseSchema),
    itemPhaseController.createItemPhase
)

itemPhaseRouter.get(
    '/',
    isAuth,
    validate(getItemPhaseByCampaignSchema),
    itemPhaseController.getItemPhaseByCampaignId
)

/**
 * @openapi
 * /campaigns/{campaignId}/item-phases/{phaseId}:
 *   put:
 *     summary: Cập nhật giai đoạn quyên góp hiện vật
 *     tags: [Item Phase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: phaseId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               acceptedItems:
 *                 type: array
 *                 items:
 *                   type: string
 *               collectionAddress:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
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
 *                       $ref: '#/components/schemas/ItemPhaseOutput'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
itemPhaseRouter.put(
    '/:phaseId',
    isAuth,
    isCreator,
    validate(updateItemPhaseSchema),
    itemPhaseController.updateItemPhase
)

/**
 * @openapi
 * /campaigns/{campaignId}/item-phases/{phaseId}:
 *   delete:
 *     summary: Xóa giai đoạn quyên góp hiện vật
 *     tags: [Item Phase]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: phaseId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: No Content
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       409:
 *         description: Conflict
 */
itemPhaseRouter.delete(
    '/:phaseId',
    isAuth,
    isCreator,
    validate(deleteItemPhaseSchema),
    itemPhaseController.deleteItemPhase
)

export default itemPhaseRouter
