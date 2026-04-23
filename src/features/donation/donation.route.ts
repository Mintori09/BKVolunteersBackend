import { Router } from 'express'
import validate from 'src/common/middleware/validate'
import isAuth from 'src/common/middleware/isAuth'
import { restrictTo } from 'src/common/middleware/restrictTo'
import { proofUpload } from 'src/utils/upload'
import * as donationController from './donation.controller'
import {
    createDonationSchema,
    donationIdSchema,
    rejectDonationSchema,
    verifyDonationSchema,
    myDonationsSchema,
    adminDonationsSchema,
} from './donation.validation'

const donationRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Donation
 *   description: Donation management
 */

/**
 * @openapi
 * /donations/money:
 *   post:
 *     summary: Submit money donation with proof image
 *     tags: [Donation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - moneyPhaseId
 *               - amount
 *               - proofImageUrl
 *             properties:
 *               moneyPhaseId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               proofImageUrl:
 *                 type: string
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
 *                       $ref: '#/components/schemas/DonationOutput'
 */
donationRouter.post(
    '/money',
    isAuth,
    restrictTo('SINHVIEN'),
    validate(createDonationSchema),
    donationController.submitDonation
)

/**
 * @openapi
 * /donations/{id}/reject:
 *   post:
 *     summary: Reject donation
 *     tags: [Donation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
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
 *                       $ref: '#/components/schemas/DonationOutput'
 */
donationRouter.post(
    '/:id/reject',
    isAuth,
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(rejectDonationSchema),
    donationController.rejectDonation
)

/**
 * @openapi
 * /donations/{id}:
 *   put:
 *     summary: Verify donation with actual amount
 *     tags: [Donation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - verifiedAmount
 *             properties:
 *               verifiedAmount:
 *                 type: number
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
 *                       $ref: '#/components/schemas/DonationOutput'
 */
donationRouter.put(
    '/:id',
    isAuth,
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(verifyDonationSchema),
    donationController.verifyDonation
)

/**
 * @openapi
 * /donations/me:
 *   get:
 *     summary: Get my donation history
 *     tags: [Donation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
donationRouter.get(
    '/me',
    isAuth,
    restrictTo('SINHVIEN'),
    validate(myDonationsSchema),
    donationController.getMyDonations
)

donationRouter.get(
    '/admin',
    isAuth,
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(adminDonationsSchema),
    donationController.getDonationsForAdmin
)

/**
 * @openapi
 * /donations/admin:
 *   get:
 *     summary: Get donations for admin review
 *     tags: [Donation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, VERIFIED, REJECTED]
 *       - in: query
 *         name: phaseType
 *         schema:
 *           type: string
 *           enum: [money, item]
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
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
 *                       $ref: '#/components/schemas/DonationListOutput'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

export default donationRouter
