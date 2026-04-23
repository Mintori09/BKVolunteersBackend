import { Router } from 'express'
import validate from 'src/common/middleware/validate'
import { isAuth, isStudent, isCreator } from 'src/common/middleware'
import {
    createItemDonationSchema,
    getItemDonationsSchema,
    verifyItemDonationSchema,
} from './item-donation.validation'
import * as itemDonationController from './item-donation.controller'

const itemDonationRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Item Donation
 *   description: Quản lý đóng góp hiện vật
 */

/**
 * @openapi
 * /donations/items:
 *   post:
 *     summary: Sinh viên đóng góp hiện vật
 *     tags: [Item Donation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemPhaseId
 *               - itemDescription
 *             properties:
 *               itemPhaseId:
 *                 type: integer
 *               itemDescription:
 *                 type: string
 *               proofImageUrl:
 *                 type: string
 *                 format: uri
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
 *                       $ref: '#/components/schemas/ItemDonationOutput'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found
 */
itemDonationRouter.post(
    '/items',
    isAuth,
    isStudent,
    validate(createItemDonationSchema),
    itemDonationController.createItemDonation
)

/**
 * @openapi
 * /item-phases/items:
 *   post:
 *     summary: Sinh viên đóng góp hiện vật
 *     tags: [Item Donation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemPhaseId
 *               - itemDescription
 *             properties:
 *               itemPhaseId:
 *                 type: integer
 *               itemDescription:
 *                 type: string
 *               proofImageUrl:
 *                 type: string
 *                 format: uri
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
 *                       $ref: '#/components/schemas/ItemDonationOutput'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found
 */

/**
 * @openapi
 * /item-phases/{phaseId}/donations:
 *   get:
 *     summary: Xem danh sách đóng góp hiện vật của giai đoạn
 *     tags: [Item Donation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: phaseId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, VERIFIED, REJECTED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
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
 *                       $ref: '#/components/schemas/DonationListOutput'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
itemDonationRouter.get(
    '/:phaseId/donations',
    isAuth,
    isCreator,
    validate(getItemDonationsSchema),
    itemDonationController.getItemDonationsByPhase
)

/**
 * @openapi
 * /donations/{phaseId}/donations:
 *   get:
 *     summary: Xem danh sách đóng góp hiện vật của giai đoạn
 *     tags: [Item Donation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: phaseId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, VERIFIED, REJECTED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
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
 *                       $ref: '#/components/schemas/ItemDonationOutput'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */

itemDonationRouter.post(
    '/:id/verify',
    isAuth,
    isCreator,
    validate(verifyItemDonationSchema),
    itemDonationController.verifyItemDonation
)

/**
 * @openapi
 * /donations/{id}/verify:
 *   post:
 *     summary: Xác thực đóng góp hiện vật
 *     tags: [Item Donation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               points:
 *                 type: integer
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
 *                       $ref: '#/components/schemas/ItemDonationOutput'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
/**
 * @openapi
 * /item-phases/{id}/verify:
 *   post:
 *     summary: Xác thực đóng góp hiện vật
 *     tags: [Item Donation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               points:
 *                 type: integer
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */

export default itemDonationRouter
