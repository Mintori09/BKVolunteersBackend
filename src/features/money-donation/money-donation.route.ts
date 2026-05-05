import { Router } from 'express'
import validate from 'src/common/middleware/validate'
import isAuth from 'src/common/middleware/isAuth'
import { restrictTo } from 'src/common/middleware/restrictTo'
import * as moneyDonationController from './money-donation.controller'
import {
    createMoneyPhaseSchema,
    updateMoneyPhaseSchema,
    moneyPhaseParamsSchema,
    phaseIdSchema,
    donationsQuerySchema,
} from './money-donation.validation'

const moneyDonationRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Money Donation
 *   description: Money donation phase management
 */

/**
 * @openapi
 * /campaigns/{campaignId}/money-phases:
 *   post:
 *     summary: Create money donation phase
 *     tags: [Money Donation]
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
 *               - targetAmount
 *               - bankAccountNo
 *               - bankAccountName
 *               - bankCode
 *             properties:
 *               targetAmount:
 *                 type: number
 *               bankAccountNo:
 *                 type: string
 *               bankAccountName:
 *                 type: string
 *               bankCode:
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
 *                       $ref: '#/components/schemas/MoneyPhaseWithCampaign'
 */
moneyDonationRouter.post(
    '/',
    isAuth,
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(createMoneyPhaseSchema),
    moneyDonationController.createMoneyPhase
)

/**
 * @openapi
 * /campaigns/{campaignId}/money-phases/{phaseId}:
 *   get:
 *     summary: Get money donation phase by ID
 *     tags: [Money Donation]
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
 *                       $ref: '#/components/schemas/MoneyPhaseWithCampaign'
 */
moneyDonationRouter.get(
    '/:phaseId',
    isAuth,
    validate(moneyPhaseParamsSchema),
    moneyDonationController.getMoneyPhase
)

/**
 * @openapi
 * /campaigns/{campaignId}/money-phases/{phaseId}:
 *   put:
 *     summary: Update money donation phase
 *     tags: [Money Donation]
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
 *               targetAmount:
 *                 type: number
 *               bankAccountNo:
 *                 type: string
 *               bankAccountName:
 *                 type: string
 *               bankCode:
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
 *                       $ref: '#/components/schemas/MoneyPhaseWithCampaign'
 */
moneyDonationRouter.put(
    '/:phaseId',
    isAuth,
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(updateMoneyPhaseSchema),
    moneyDonationController.updateMoneyPhase
)

/**
 * @openapi
 * /campaigns/{campaignId}/money-phases/{phaseId}:
 *   delete:
 *     summary: Delete money donation phase
 *     tags: [Money Donation]
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
 */
moneyDonationRouter.delete(
    '/:phaseId',
    isAuth,
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(moneyPhaseParamsSchema),
    moneyDonationController.deleteMoneyPhase
)

/**
 * @openapi
 * /campaigns/{campaignId}/money-phases/{phaseId}/progress:
 *   get:
 *     summary: Get money donation phase progress
 *     tags: [Money Donation]
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
 */
moneyDonationRouter.get(
    '/:phaseId/progress',
    isAuth,
    validate(moneyPhaseParamsSchema),
    moneyDonationController.getPhaseProgress
)

const phaseDonationsRouter = Router()

/**
 * @openapi
 * /money-phases/{phaseId}/donations:
 *   get:
 *     summary: Get donations of a money phase
 *     tags: [Money Donation]
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
phaseDonationsRouter.get(
    '/:phaseId/donations',
    isAuth,
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(donationsQuerySchema),
    moneyDonationController.getPhaseDonations
)

export { moneyDonationRouter, phaseDonationsRouter }
export default moneyDonationRouter
