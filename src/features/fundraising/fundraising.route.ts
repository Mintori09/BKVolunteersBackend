import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import validate from 'src/common/middleware/validate'
import * as fundraisingController from './fundraising.controller'
import {
    createFundraisingDonationSchema,
    fundraisingDecisionSchema,
    fundraisingModuleConfigSchema,
    fundraisingModuleSchema,
    listFundraisingDonationsSchema,
    sepayWebhookSchema,
} from './fundraising.validation'

const fundraisingRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Fundraising
 *   description: Canonical fundraising module endpoints
 * components:
 *   schemas:
 *     FundraisingModuleOutput:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 11 }
 *         campaign_id: { type: integer, example: 7 }
 *         type: { type: string, example: FUNDRAISING }
 *         title: { type: string, example: Gây quỹ học bổng }
 *         status: { type: string, example: ACTIVE }
 *         settings_json: { type: object, nullable: true }
 *         total_raised: { type: number, example: 1500000 }
 *         campaign:
 *           type: object
 *           properties:
 *             id: { type: integer, example: 7 }
 *             title: { type: string, example: Chiến dịch mùa hè xanh }
 *             status: { type: string, example: ONGOING }
 *             slug: { type: string, example: chien-dich-mua-he-xanh }
 *     FundraisingModuleConfigBody:
 *       type: object
 *       properties:
 *         settings_json:
 *           type: object
 *           additionalProperties: true
 *         status: { type: string, example: ACTIVE }
 *     FundraisingModuleConfigOutput:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 11 }
 *         settings_json: { type: object, nullable: true }
 *         status: { type: string, example: ACTIVE }
 *     CreateFundraisingDonationBody:
 *       type: object
 *       required: [amount]
 *       properties:
 *         amount: { type: number, example: 100000 }
 *         donor_name: { type: string, example: Nguyễn Văn A }
 *         message: { type: string, example: Chúc chiến dịch thành công }
 *         evidence_url: { type: string, format: uri, nullable: true }
 *     FundraisingDonationOutput:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 501 }
 *         campaign_id: { type: integer, example: 7 }
 *         module_id: { type: integer, example: 11 }
 *         student_id: { type: integer, example: 42 }
 *         donor_name: { type: string, nullable: true }
 *         amount: { type: number, example: 100000 }
 *         message: { type: string, nullable: true }
 *         evidence_url: { type: string, nullable: true }
 *         status: { type: string, example: PENDING }
 *         matched_transaction_id: { type: integer, nullable: true }
 *         verified_by: { type: integer, nullable: true }
 *         verified_at: { type: string, format: date-time, nullable: true }
 *         reject_reason: { type: string, nullable: true }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *     FundraisingDonationListOutput:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FundraisingDonationOutput'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationMeta'
 *     FundraisingDecisionBody:
 *       type: object
 *       properties:
 *         reason: { type: string, example: Đã đối soát thành công }
 *         reject_reason: { type: string, example: Chứng từ không hợp lệ }
 *     SepayWebhookBody:
 *       type: object
 *       properties:
 *         transaction_id: { type: string, example: tx_001 }
 *         id: { type: string, example: tx_001 }
 *         gateway_transaction_id: { type: string, example: bank_001 }
 *         amount: { type: number, example: 100000 }
 *         content: { type: string, example: ung ho module 11 }
 *         account_number: { type: string, example: '9704xxxx' }
 *         transaction_time: { type: string, format: date-time }
 *         created_at: { type: string, format: date-time }
 *         module_id: { type: string, example: '11' }
 *         campaign_id: { type: string, example: '7' }
 *     SepayWebhookOutput:
 *       type: object
 *       properties:
 *         accepted: { type: boolean, example: true }
 *         transaction_id: { type: integer, example: 8801 }
 *         match_status: { type: string, example: MATCHED }
 *         matched_donation_id: { type: integer, nullable: true }
 *         raw_payload:
 *           type: object
 *           additionalProperties: true
 */

/**
 * @openapi
 * /fundraising/modules/{moduleId}:
 *   get:
 *     summary: Get fundraising module
 *     tags: [Fundraising]
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Fundraising module detail
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FundraisingModuleOutput'
 */

fundraisingRouter.get(
    '/modules/:moduleId',
    validate(fundraisingModuleSchema),
    fundraisingController.getModule
)

/**
 * @openapi
 * /fundraising/modules/{moduleId}/config:
 *   patch:
 *     summary: Update fundraising module config
 *     tags: [Fundraising]
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
 *             $ref: '#/components/schemas/FundraisingModuleConfigBody'
 *     responses:
 *       200:
 *         description: Fundraising module updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FundraisingModuleConfigOutput'
 */
fundraisingRouter.patch(
    '/modules/:moduleId/config',
    isAuth,
    validate(fundraisingModuleConfigSchema),
    fundraisingController.updateModuleConfig
)

/**
 * @openapi
 * /fundraising/modules/{moduleId}/donations:
 *   post:
 *     summary: Create fundraising donation
 *     tags: [Fundraising]
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
 *             $ref: '#/components/schemas/CreateFundraisingDonationBody'
 *     responses:
 *       201:
 *         description: Donation created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FundraisingDonationOutput'
 *   get:
 *     summary: List fundraising donations
 *     tags: [Fundraising]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *     responses:
 *       200:
 *         description: Donation list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FundraisingDonationListOutput'
 */
fundraisingRouter.post(
    '/modules/:moduleId/donations',
    isAuth,
    validate(createFundraisingDonationSchema),
    fundraisingController.createDonation
)

fundraisingRouter.get(
    '/modules/:moduleId/donations',
    isAuth,
    validate(listFundraisingDonationsSchema),
    fundraisingController.listDonations
)

/**
 * @openapi
 * /fundraising/donations/{id}/verify:
 *   patch:
 *     summary: Verify fundraising donation
 *     tags: [Fundraising]
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
 *             $ref: '#/components/schemas/FundraisingDecisionBody'
 *     responses:
 *       200:
 *         description: Donation verified
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FundraisingDonationOutput'
 *       409:
 *         description: State conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StateConflictError'
 */
fundraisingRouter.patch(
    '/donations/:id/verify',
    isAuth,
    validate(fundraisingDecisionSchema),
    fundraisingController.verifyDonation
)

/**
 * @openapi
 * /fundraising/donations/{id}/reject:
 *   patch:
 *     summary: Reject fundraising donation
 *     tags: [Fundraising]
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
 *             $ref: '#/components/schemas/FundraisingDecisionBody'
 *     responses:
 *       200:
 *         description: Donation rejected
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FundraisingDonationOutput'
 *       409:
 *         description: State conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StateConflictError'
 */
fundraisingRouter.patch(
    '/donations/:id/reject',
    isAuth,
    validate(fundraisingDecisionSchema),
    fundraisingController.rejectDonation
)

/**
 * @openapi
 * /fundraising/sepay/webhook:
 *   post:
 *     summary: Receive SePay webhook
 *     tags: [Fundraising]
 *     parameters:
 *       - in: header
 *         name: x-sepay-secret
 *         required: false
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SepayWebhookBody'
 *     responses:
 *       200:
 *         description: Webhook accepted
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SepayWebhookOutput'
 */
fundraisingRouter.post(
    '/sepay/webhook',
    validate(sepayWebhookSchema),
    fundraisingController.handleSepayWebhook
)

export default fundraisingRouter
