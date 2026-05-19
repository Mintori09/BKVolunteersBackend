import { Router } from 'express'
import validate from 'src/common/middleware/validate'
import * as reportsController from './reports.controller'
import {
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
 *       required: [total_campaigns, total_students, total_organizations, total_money_donations]
 *       properties:
 *         total_campaigns: { type: integer, example: 12 }
 *         total_students: { type: integer, example: 2500 }
 *         total_organizations: { type: integer, example: 16 }
 *         total_money_donations: { type: number, example: 35000000 }
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
    validate(campaignReportSchema),
    reportsController.getCampaignReport
)

/**
 * @openapi
 * /reports/school/overview:
 *   get:
 *     summary: Get school overview report
 *     description: Return top-level canonical totals for school reporting dashboards.
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema: { type: integer, minimum: 1 }
 *         example: 1
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
    validate(schoolOverviewSchema),
    reportsController.getSchoolOverview
)

export default reportsRouter
