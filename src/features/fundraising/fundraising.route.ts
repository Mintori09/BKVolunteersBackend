import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import validate from 'src/common/middleware/validate'
import * as fundraisingController from './fundraising.controller'
import {
    attachFundraisingTransactionSchema,
    createFundraisingDonationSchema,
    fundraisingDecisionSchema,
    fundraisingModuleConfigSchema,
    fundraisingModuleSchema,
    fundraisingTransactionSchema,
    listFundraisingTransactionsSchema,
    listFundraisingDonationsSchema,
    fundraisingDonationSchema,
    sepayWebhookSchema,
    sepayAccountListSchema,
    sepaySyncTransactionsSchema,
    sepaySyncVirtualAccountsSchema,
    sepayCreateOrderVaSchema,
    sepayOperationRequestSchema,
    sepayOperationRequestListSchema,
    sepayOperationRequestDecisionSchema,
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
 *         target_amount: { type: number, example: 5000000 }
 *         receiver_name: { type: string, example: "CLB Tinh nguyen CNTT" }
 *         bank_name: { type: string, example: "Vietcombank" }
 *         bank_account_no: { type: string, example: "123456789" }
 *         currency: { type: string, example: "VND" }
 *         sepay_enabled: { type: boolean, example: true }
 *         sepay_account_id: { type: string, nullable: true, example: "sp-01" }
 *         sepay_bank_account_id: { type: string, nullable: true, example: "acc_demo_bidv_1" }
 *         sepay_mode: { type: string, enum: [TRANSFER_CODE, ORDER_VA], example: ORDER_VA }
 *         sepay_va_prefix: { type: string, nullable: true, example: BKVVA }
 *         status: { type: string, example: ACTIVE }
 *     FundraisingModuleConfigOutput:
 *       type: object
 *       properties:
 *         module_id: { type: integer, example: 11 }
 *         config: { type: object, nullable: true }
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
 *         payment_code: { type: string, nullable: true, example: BKV-501 }
 *         payment_mode: { type: string, example: TRANSFER_CODE }
 *         payment_expires_at: { type: string, format: date-time, nullable: true }
 *         message: { type: string, nullable: true }
 *         evidence_url: { type: string, nullable: true }
 *         status: { type: string, example: PENDING }
 *         matched_transaction_id: { type: integer, nullable: true }
 *         matched_at: { type: string, format: date-time, nullable: true }
 *         sepay_bank_account_id: { type: string, nullable: true }
 *         verified_by: { type: integer, nullable: true }
 *         verified_at: { type: string, format: date-time, nullable: true }
 *         reject_reason: { type: string, nullable: true }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *         ingest_state: { type: string, nullable: true, example: matched_pending_verification }
 *         provider_references:
 *           type: object
 *           nullable: true
 *           properties:
 *             sepay_order_id: { type: string, nullable: true }
 *             sepay_bank_account_id: { type: string, nullable: true }
 *             sepay_virtual_account_id: { type: string, nullable: true }
 *         payment_instruction:
 *           type: object
 *           nullable: true
 *           properties:
 *             receiver_name: { type: string, nullable: true }
 *             bank_name: { type: string, nullable: true }
 *             bank_account_no: { type: string, nullable: true }
 *             amount: { type: number, example: 100000 }
 *             currency: { type: string, example: VND }
 *             payment_code: { type: string, nullable: true, example: BKV-501 }
 *             transfer_content: { type: string, nullable: true, example: BKV-501 }
 *             expires_at: { type: string, format: date-time, nullable: true }
 *             vietqr_url: { type: string, nullable: true, example: "https://img.vietqr.io/..." }
 *             sepay_order_id: { type: string, nullable: true, example: order_0001 }
 *             virtual_account:
 *               type: object
 *               nullable: true
 *               properties:
 *                 id: { type: string, nullable: true, example: va_0001 }
 *                 va_number: { type: string, example: BKVVA1000000002 }
 *                 holder_name: { type: string, nullable: true, example: Nguyen Van A }
 *                 amount: { type: number, example: 100000 }
 *                 expires_at: { type: string, format: date-time, nullable: true }
 *                 status: { type: string, nullable: true, example: ACTIVE }
 *             provider_qr_url: { type: string, nullable: true, example: "https://img.vietqr.io/..." }
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
 *         transaction_id: { type: integer, nullable: true, example: 8801 }
 *     FundraisingTransactionOutput:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 8801 }
 *         provider: { type: string, example: SEPAY }
 *         provider_transaction_id: { type: string, example: tx_001 }
 *         campaign_id: { type: integer, nullable: true, example: 7 }
 *         module_id: { type: integer, nullable: true, example: 11 }
 *         amount: { type: number, example: 100000 }
 *         content: { type: string, nullable: true }
 *         account_no: { type: string, nullable: true }
 *         transaction_time: { type: string, format: date-time }
 *         ingest_source: { type: string, example: API_PULL }
 *         sepay_account_id: { type: string, nullable: true }
 *         sepay_va_id: { type: string, nullable: true }
 *         sepay_order_code: { type: string, nullable: true }
 *         reference_number: { type: string, nullable: true }
 *         webhook_success: { type: boolean, nullable: true }
 *         match_status: { type: string, example: MATCHED }
 *         matched_donation_id: { type: integer, nullable: true, example: 501 }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *         matched_donation:
 *           type: object
 *           nullable: true
 *           properties:
 *             id: { type: integer, example: 501 }
 *             donor_name: { type: string, nullable: true }
 *             amount: { type: number, example: 100000 }
 *             status: { type: string, example: MATCHED }
 *             created_at: { type: string, format: date-time }
 *     FundraisingTransactionListOutput:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FundraisingTransactionOutput'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationMeta'
 *     AttachFundraisingTransactionBody:
 *       type: object
 *       required: [donation_id]
 *       properties:
 *         donation_id: { type: integer, example: 501 }
 *     SepayWebhookBody:
 *       type: object
 *       properties:
 *         transaction_id: { type: string, example: tx_001 }
 *         id:
 *           oneOf:
 *             - { type: string, example: tx_001 }
 *             - { type: integer, example: 4159 }
 *         gateway_transaction_id: { type: string, example: bank_001 }
 *         amount: { type: number, example: 100000 }
 *         transferAmount: { type: number, example: 100000 }
 *         content: { type: string, example: ung ho module 11 }
 *         description: { type: string, example: ung ho BKV-501 }
 *         account_number: { type: string, example: '9704xxxx' }
 *         accountNumber: { type: string, example: '0000000001' }
 *         transaction_time: { type: string, format: date-time }
 *         created_at: { type: string, format: date-time }
 *         transactionDate: { type: string, format: date-time }
 *         referenceCode: { type: string, example: SB9C79C3AABC1D }
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
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, MATCHED, VERIFIED, REJECTED, REFUNDED] }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
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

fundraisingRouter.get(
    '/modules/:moduleId/donations/export',
    isAuth,
    validate(fundraisingModuleSchema),
    fundraisingController.exportDonations
)

fundraisingRouter.get(
    '/donations/:id',
    isAuth,
    validate(fundraisingDonationSchema),
    fundraisingController.getDonation
)

/**
 * @openapi
 * /fundraising/transactions:
 *   get:
 *     summary: List SePay/payment transactions for reconciliation
 *     tags: [Fundraising]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: match_status
 *         schema: { type: string, enum: [MATCHED, UNMATCHED] }
 *       - in: query
 *         name: module_id
 *         schema: { type: integer }
 *       - in: query
 *         name: campaign_id
 *         schema: { type: integer }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Transaction reconciliation queue
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FundraisingTransactionListOutput'
 */
fundraisingRouter.get(
    '/transactions',
    isAuth,
    validate(listFundraisingTransactionsSchema),
    fundraisingController.listTransactions
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
 * /fundraising/transactions/{id}/attach-donation:
 *   patch:
 *     summary: Attach transaction to donation for manual reconciliation
 *     tags: [Fundraising]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AttachFundraisingTransactionBody'
 *     responses:
 *       200:
 *         description: Transaction matched to donation
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FundraisingTransactionOutput'
 */
fundraisingRouter.patch(
    '/transactions/:id/attach-donation',
    isAuth,
    validate(attachFundraisingTransactionSchema),
    fundraisingController.attachTransactionToDonation
)

/**
 * @openapi
 * /fundraising/transactions/{id}/unmatch:
 *   patch:
 *     summary: Remove transaction to donation match
 *     tags: [Fundraising]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Transaction unmatched
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FundraisingTransactionOutput'
 */
fundraisingRouter.patch(
    '/transactions/:id/unmatch',
    isAuth,
    validate(fundraisingTransactionSchema),
    fundraisingController.unmatchTransaction
)

fundraisingRouter.get(
    '/sepay/accounts',
    isAuth,
    validate(sepayAccountListSchema),
    fundraisingController.listSepayAccounts
)

fundraisingRouter.post(
    '/sepay/accounts/sync',
    isAuth,
    validate(sepayAccountListSchema),
    fundraisingController.syncSepayAccounts
)

fundraisingRouter.get(
    '/sepay/sync-status',
    isAuth,
    fundraisingController.getSepaySyncStatus
)

fundraisingRouter.post(
    '/sepay/transactions/sync',
    isAuth,
    validate(sepaySyncTransactionsSchema),
    fundraisingController.syncSepayTransactions
)

fundraisingRouter.get(
    '/sepay/transactions/unmatched',
    isAuth,
    fundraisingController.listSepayUnmatchedTransactions
)

fundraisingRouter.post(
    '/sepay/virtual-accounts/sync',
    isAuth,
    validate(sepaySyncVirtualAccountsSchema),
    fundraisingController.syncSepayVirtualAccounts
)

fundraisingRouter.post(
    '/sepay/order-va/create',
    isAuth,
    validate(sepayCreateOrderVaSchema),
    fundraisingController.createSepayOrderVa
)

fundraisingRouter.get(
    '/sepay/requests',
    isAuth,
    validate(sepayOperationRequestListSchema),
    fundraisingController.listSepayOperationRequests
)

fundraisingRouter.post(
    '/sepay/requests',
    isAuth,
    validate(sepayOperationRequestSchema),
    fundraisingController.createSepayOperationRequest
)

fundraisingRouter.post(
    '/sepay/requests/:id/approve',
    isAuth,
    validate(sepayOperationRequestDecisionSchema),
    fundraisingController.approveSepayOperationRequest
)

fundraisingRouter.post(
    '/sepay/requests/:id/reject',
    isAuth,
    validate(sepayOperationRequestDecisionSchema),
    fundraisingController.rejectSepayOperationRequest
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
 *         description: Legacy shared-secret header kept for backward compatibility
 *       - in: header
 *         name: x-sepay-signature
 *         required: false
 *         schema: { type: string }
 *         description: SePay HMAC-SHA256 signature in the format `sha256={hex_hash}`
 *       - in: header
 *         name: x-sepay-timestamp
 *         required: false
 *         schema: { type: string }
 *         description: Unix timestamp (seconds) used in the HMAC payload `{timestamp}.{raw_body}`
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
