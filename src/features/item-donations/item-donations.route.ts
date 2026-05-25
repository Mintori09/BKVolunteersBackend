import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import validate from 'src/common/middleware/validate'
import * as itemDonationsController from './item-donations.controller'
import {
    confirmItemPledgeSchema,
    createItemTargetSchema,
    createItemPledgeSchema,
    getItemPledgesSchema,
    getItemTargetsSchema,
    handoverItemPledgeSchema,
    itemDonationModuleSchema,
    itemTargetParamsSchema,
    rejectItemPledgeSchema,
    updateItemTargetSchema,
    updateItemDonationConfigSchema,
} from './item-donations.validation'

const itemDonationsRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Item Donations
 *   description: Canonical item donation module endpoints
 * components:
 *   schemas:
 *     ItemDonationModuleOutput:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 22 }
 *         campaign_id: { type: integer, example: 7 }
 *         type: { type: string, example: ITEM_DONATION }
 *         title: { type: string, example: Quyên góp sách }
 *         description: { type: string, nullable: true }
 *         status: { type: string, example: ACTIVE }
 *         settings_json: { type: object, nullable: true }
 *         pledged_quantity: { type: integer, example: 140 }
 *         targets:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id: { type: integer, example: 1 }
 *               name: { type: string, example: Sách giáo khoa }
 *               unit: { type: string, example: quyển }
 *               target_quantity: { type: integer, example: 300 }
 *               received_quantity: { type: integer, example: 120 }
 *         campaign:
 *           type: object
 *           properties:
 *             id: { type: integer, example: 7 }
 *             title: { type: string, example: Chiến dịch mùa hè xanh }
 *             slug: { type: string, example: chien-dich-mua-he-xanh }
 *             status: { type: string, example: ONGOING }
 *     CreateItemPledgeBody:
 *       type: object
 *       required: [item_target_id, quantity]
 *       properties:
 *         item_target_id: { type: string, example: '1' }
 *         quantity: { type: integer, example: 20 }
 *         donor_name: { type: string, example: Nguyễn Văn A }
 *         note: { type: string, example: Giao vào sáng thứ hai }
 *     CreateItemPledgeOutput:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 51 }
 *         status: { type: string, example: PENDING }
 *         quantity: { type: integer, example: 20 }
 *         item_target_id: { type: integer, example: 1 }
 *     ConfirmItemPledgeOutput:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 51 }
 *         status: { type: string, example: CONFIRMED }
 */

/**
 * @openapi
 * /item-donations/modules/{moduleId}:
 *   get:
 *     summary: Get item donation module
 *     tags: [Item Donations]
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Item donation module detail
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ItemDonationModuleOutput'
 *       404:
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 */

itemDonationsRouter.get(
    '/modules/:moduleId',
    validate(itemDonationModuleSchema),
    itemDonationsController.getItemDonationModule
)

itemDonationsRouter.patch(
    '/modules/:moduleId/config',
    isAuth,
    validate(updateItemDonationConfigSchema),
    itemDonationsController.updateModuleConfig
)

itemDonationsRouter.post(
    '/modules/:moduleId/targets',
    isAuth,
    validate(createItemTargetSchema),
    itemDonationsController.createTarget
)

itemDonationsRouter.get(
    '/modules/:moduleId/targets',
    validate(getItemTargetsSchema),
    itemDonationsController.getTargets
)

itemDonationsRouter.patch(
    '/targets/:id',
    isAuth,
    validate(updateItemTargetSchema),
    itemDonationsController.updateTarget
)

itemDonationsRouter.delete(
    '/targets/:id',
    isAuth,
    validate(itemTargetParamsSchema),
    itemDonationsController.deleteTarget
)

/**
 * @openapi
 * /item-donations/modules/{moduleId}/pledges:
 *   post:
 *     summary: Create item pledge
 *     tags: [Item Donations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateItemPledgeBody'
 *     responses:
 *       201:
 *         description: Item pledge created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CreateItemPledgeOutput'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 */
itemDonationsRouter.post(
    '/modules/:moduleId/pledges',
    isAuth,
    validate(createItemPledgeSchema),
    itemDonationsController.createPledge
)

itemDonationsRouter.get(
    '/modules/:moduleId/pledges',
    isAuth,
    validate(getItemPledgesSchema),
    itemDonationsController.getPledges
)

/**
 * @openapi
 * /item-donations/pledges/{id}/confirm:
 *   patch:
 *     summary: Confirm item pledge
 *     tags: [Item Donations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Item pledge confirmed
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ConfirmItemPledgeOutput'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 */
itemDonationsRouter.patch(
    '/pledges/:id/confirm',
    isAuth,
    validate(confirmItemPledgeSchema),
    itemDonationsController.confirmPledge
)

itemDonationsRouter.patch(
    '/pledges/:id/reject',
    isAuth,
    validate(rejectItemPledgeSchema),
    itemDonationsController.rejectPledge
)

itemDonationsRouter.post(
    '/pledges/:id/handover',
    isAuth,
    validate(handoverItemPledgeSchema),
    itemDonationsController.handoverPledge
)

export default itemDonationsRouter
