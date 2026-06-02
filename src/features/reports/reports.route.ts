import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import { restrictTo } from 'src/common/middleware/restrictTo'
import validate from 'src/common/middleware/validate'
import * as reportsController from './reports.controller'
import {
    campaignReconciliationSchema,
    campaignReportSchema,
    schoolOverviewSchema,
} from './reports.validation'

const reportsRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Reports
 *   description: Canonical reporting endpoints
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     CampaignReportModuleOutput:
 *       type: object
 *       required: [id, type, status]
 *       properties:
 *         id: { type: integer, example: 3001 }
 *         type: { type: string, example: "FUNDRAISING" }
 *         status: { type: string, example: "ACTIVE" }
 *     CampaignReportOutput:
 *       type: object
 *       required: [campaign, modules, fundraising, item_donations, events, certificates]
 *       properties:
 *         campaign:
 *           type: object
 *           required: [id, title, slug, status]
 *           properties:
 *             id: { type: integer, example: 101 }
 *             title: { type: string, example: "Mua he xanh 2026" }
 *             slug: { type: string, example: "mua-he-xanh-2026" }
 *             status: { type: string, example: "ONGOING" }
 *         modules:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CampaignReportModuleOutput'
 *         fundraising:
 *           type: object
 *           required: [total_verified_amount, total_donations, verified_donations]
 *           properties:
 *             total_verified_amount: { type: number, example: 15000000 }
 *             total_donations: { type: integer, example: 45 }
 *             verified_donations: { type: integer, example: 40 }
 *         item_donations:
 *           type: object
 *           required: [confirmed_quantity]
 *           properties:
 *             confirmed_quantity: { type: integer, example: 120 }
 *         events:
 *           type: object
 *           required: [registrations, approved_registrations]
 *           properties:
 *             registrations: { type: integer, example: 80 }
 *             approved_registrations: { type: integer, example: 65 }
 *         certificates:
 *           type: object
 *           required: [total]
 *           properties:
 *             total: { type: integer, example: 60 }
 *     SchoolOverviewOutput:
 *       type: object
 *       required: [total_campaigns, total_students, total_organizations, total_money_donations, organization_breakdown, module_breakdown, status_breakdown, filters_applied]
 *       properties:
 *         total_campaigns: { type: integer, example: 12 }
 *         total_students: { type: integer, example: 2500 }
 *         total_organizations: { type: integer, example: 16 }
 *         total_money_donations: { type: number, example: 35000000 }
 *         organization_breakdown:
 *           type: array
 *           items:
 *             type: object
 *             required: [organization_id, organization_name, organization_code, campaign_count, verified_money_amount, received_item_quantity, completed_event_registrations, completed_event_hours, issued_certificates]
 *             properties:
 *               organization_id: { type: integer, example: 12 }
 *               organization_name: { type: string, example: "CLB Tinh nguyen CNTT" }
 *               organization_code: { type: string, example: "CLB-CNTT" }
 *               campaign_count: { type: integer, example: 3 }
 *               verified_money_amount: { type: number, example: 15000000 }
 *               received_item_quantity: { type: integer, example: 48 }
 *               completed_event_registrations: { type: integer, example: 24 }
 *               completed_event_hours: { type: number, example: 72 }
 *               issued_certificates: { type: integer, example: 18 }
 *         module_breakdown:
 *           type: array
 *           items:
 *             type: object
 *             required: [module_type, campaign_count]
 *             properties:
 *               module_type: { type: string, enum: [fundraising, item_donation, event] }
 *               campaign_count: { type: integer, example: 4 }
 *         status_breakdown:
 *           type: array
 *           items:
 *             type: object
 *             required: [status, campaign_count]
 *             properties:
 *               status: { type: string, example: "PUBLISHED" }
 *               campaign_count: { type: integer, example: 5 }
 *         filters_applied:
 *           type: object
 *           additionalProperties: false
 *           properties:
 *             from: { type: string, format: date-time }
 *             to: { type: string, format: date-time }
 *             organization_id: { type: integer, example: 12 }
 *             module_type: { type: string, example: "event" }
 *             status: { type: string, example: "PUBLISHED" }
 *     CampaignReconciliationOutput:
 *       type: object
 *       required: [campaign, reconciliation]
 *       properties:
 *         campaign:
 *           type: object
 *           required: [id, title, slug, status, organization_id]
 *           properties:
 *             id: { type: integer, example: 101 }
 *             title: { type: string, example: "Mua he xanh 2026" }
 *             slug: { type: string, example: "mua-he-xanh-2026" }
 *             status: { type: string, example: "PUBLISHED" }
 *             organization_id: { type: integer, example: 12 }
 *         reconciliation:
 *           type: object
 *           required:
 *             - matched_transactions
 *             - unmatched_transactions
 *             - total_transaction_amount
 *             - matched_transaction_amount
 *             - unmatched_transaction_amount
 *             - pending_donations
 *             - matched_donations
 *             - verified_donations
 *             - rejected_donations
 *             - verified_amount
 *             - amount_gap_vs_verified
 *           properties:
 *             matched_transactions: { type: integer, example: 12 }
 *             unmatched_transactions: { type: integer, example: 3 }
 *             total_transaction_amount: { type: number, example: 18000000 }
 *             matched_transaction_amount: { type: number, example: 15000000 }
 *             unmatched_transaction_amount: { type: number, example: 3000000 }
 *             pending_donations: { type: integer, example: 2 }
 *             matched_donations: { type: integer, example: 4 }
 *             verified_donations: { type: integer, example: 10 }
 *             rejected_donations: { type: integer, example: 1 }
 *             verified_amount: { type: number, example: 12000000 }
 *             amount_gap_vs_verified: { type: number, example: 3000000 }
 */

/**
 * @openapi
 * /reports/campaigns/{id}:
 *   get:
 *     summary: Get campaign report
 *     description: Return canonical aggregates for fundraising, item donations, event registrations, and certificates for one campaign.
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         example: 101
 *     responses:
 *       200:
 *         description: Campaign report
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CampaignReportOutput'
 *       400:
 *         description: Invalid path parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       404:
 *         description: Campaign not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 */
reportsRouter.get(
    '/campaigns/:id',
    isAuth,
    restrictTo('OPERATOR'),
    validate(campaignReportSchema),
    reportsController.getCampaignReport
)

/**
 * @openapi
 * /reports/campaigns/{id}/reconciliation:
 *   get:
 *     summary: Get campaign reconciliation report
 *     description: Return SePay reconciliation totals for one campaign without changing canonical fundraising verified totals.
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         example: 101
 *     responses:
 *       200:
 *         description: Campaign reconciliation report
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CampaignReconciliationOutput'
 *       400:
 *         description: Invalid path parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenError'
 *       404:
 *         description: Campaign not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 */
reportsRouter.get(
    '/campaigns/:id/reconciliation',
    isAuth,
    restrictTo('OPERATOR'),
    validate(campaignReconciliationSchema),
    reportsController.getCampaignReconciliationReport
)

/**
 * @openapi
 * /reports/school/overview:
 *   get:
 *     summary: Get school overview report
 *     description: Return canonical school totals plus organization/module/status breakdowns for the school dashboard.
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: from
 *         required: false
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         required: false
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: organization_id
 *         required: false
 *         schema: { type: integer }
 *       - in: query
 *         name: module_type
 *         required: false
 *         schema: { type: string, enum: [fundraising, item_donation, event] }
 *       - in: query
 *         name: status
 *         required: false
 *         schema: { type: string, example: PUBLISHED }
 *     responses:
 *       200:
 *         description: School overview
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SchoolOverviewOutput'
 *       400:
 *         description: Invalid query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
reportsRouter.get(
    '/school/overview',
    isAuth,
    restrictTo('DOANTRUONG'),
    validate(schoolOverviewSchema),
    reportsController.getSchoolOverview
)

export default reportsRouter
