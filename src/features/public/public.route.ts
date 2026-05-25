import { Router } from 'express'
import validate from 'src/common/middleware/validate'
import * as publicController from './public.controller'
import {
    listPublicCampaignsSchema,
    publicCampaignSlugSchema,
    publicCertificateVerifySchema,
} from './public.validation'

const publicRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Public
 *   description: Public campaign and certificate endpoints
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     PublicCampaignOrganization:
 *       type: object
 *       required: [id, code, name, type]
 *       properties:
 *         id: { type: integer, example: 5 }
 *         code: { type: string, example: "CLB-ITV" }
 *         name: { type: string, example: "CLB Tinh nguyen CNTT" }
 *         type: { type: string, example: "club" }
 *         logo_url: { type: string, nullable: true, example: "https://cdn.example.com/orgs/5.png" }
 *     PublicCampaignProgressModule:
 *       type: object
 *       required: [type, current, target, percent]
 *       properties:
 *         type: { type: string, example: "fundraising" }
 *         current: { type: number, example: 1500000 }
 *         target: { type: number, example: 5000000 }
 *         percent: { type: number, example: 30 }
 *     PublicCampaignProgress:
 *       type: object
 *       required: [percent, modules]
 *       properties:
 *         percent: { type: number, example: 45 }
 *         modules:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PublicCampaignProgressModule'
 *     PublicCampaignListItemOutput:
 *       type: object
 *       required: [id, slug, title, summary, organization, module_types, progress, beneficiary, scope_type, start_at, end_at, status]
 *       properties:
 *         id: { type: integer, example: 101 }
 *         slug: { type: string, example: "mua-he-xanh-2026" }
 *         title: { type: string, example: "Mua he xanh 2026" }
 *         summary: { type: string, nullable: true, example: "Chuong trinh tinh nguyen mua he" }
 *         cover_image_url: { type: string, nullable: true, example: "https://cdn.example.com/campaigns/101.jpg" }
 *         organization:
 *           $ref: '#/components/schemas/PublicCampaignOrganization'
 *         module_types:
 *           type: array
 *           items:
 *             type: string
 *             enum: [fundraising, item_donation, event]
 *         progress:
 *           $ref: '#/components/schemas/PublicCampaignProgress'
 *         beneficiary: { type: string, nullable: true, example: "Hoc sinh khu vuc kho khan" }
 *         scope_type: { type: string, example: "SCHOOL" }
 *         start_at: { type: string, format: date-time, nullable: true }
 *         end_at: { type: string, format: date-time, nullable: true }
 *         status: { type: string, example: "PUBLISHED" }
 *     PublicCampaignListOutput:
 *       type: object
 *       required: [items, pagination]
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PublicCampaignListItemOutput'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationMeta'
 *     PublicCampaignDetailOutput:
 *       allOf:
 *         - $ref: '#/components/schemas/PublicCampaignListItemOutput'
 *         - type: object
 *           required: [description, modules]
 *           properties:
 *             description: { type: string, nullable: true, example: "Noi dung chi tiet campaign" }
 *             published_at: { type: string, format: date-time, nullable: true }
 *             modules:
 *               type: array
 *               items:
 *                 type: object
 *                 required: [id, type, title, status, start_at, end_at, settings, cta]
 *                 properties:
 *                   id: { type: integer, example: 15 }
 *                   type: { type: string, enum: [fundraising, item_donation, event] }
 *                   title: { type: string, example: "Quyen gop sach vo" }
 *                   description: { type: string, nullable: true, example: "Tiep nhan sach vo cho hoc sinh" }
 *                   status: { type: string, example: "OPEN" }
 *                   start_at: { type: string, format: date-time }
 *                   end_at: { type: string, format: date-time }
 *                   settings:
 *                     type: object
 *                     additionalProperties: true
 *                   progress:
 *                     allOf:
 *                       - $ref: '#/components/schemas/PublicCampaignProgressModule'
 *                     nullable: true
 *                   cta:
 *                     type: object
 *                     required: [enabled, label, action]
 *                     properties:
 *                       enabled: { type: boolean, example: true }
 *                       label: { type: string, example: "Dang ky hien vat" }
 *                       action: { type: string, nullable: true, example: "item_pledge" }
 *     PublicCertificateVerifyCertificate:
 *       type: object
 *       required: [id, certificate_no, status, issued_at, revoked_at, student_id, campaign_id]
 *       properties:
 *         id: { type: integer, example: 9001 }
 *         certificate_no: { type: string, example: "CERT-101-5001" }
 *         status: { type: string, example: "ISSUED" }
 *         issued_at: { type: string, format: date-time, nullable: true }
 *         revoked_at: { type: string, format: date-time, nullable: true }
 *         student_id: { type: integer, example: 5001 }
 *         campaign_id: { type: integer, example: 101 }
 *     PublicCertificateVerifyOutput:
 *       type: object
 *       required: [valid, certificate]
 *       properties:
 *         valid: { type: boolean, example: true }
 *         certificate:
 *           oneOf:
 *             - $ref: '#/components/schemas/PublicCertificateVerifyCertificate'
 *             - type: 'null'
 */

/**
 * @openapi
 * /public/campaigns:
 *   get:
 *     summary: List public campaigns
 *     description: Return published and ongoing campaigns for anonymous clients.
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100 }
 *         example: 10
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         example: mua he xanh
 *       - in: query
 *         name: organization_id
 *         schema: { type: integer, minimum: 1 }
 *         example: 5
 *       - in: query
 *         name: module_type
 *         schema: { type: string, enum: [fundraising, item_donation, event] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PUBLISHED, ONGOING] }
 *     responses:
 *       200:
 *         description: Public campaign page
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PublicCampaignListOutput'
 *       400:
 *         description: Invalid query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
publicRouter.get(
    '/campaigns',
    validate(listPublicCampaignsSchema),
    publicController.listCampaigns
)

/**
 * @openapi
 * /public/campaigns/{slug}:
 *   get:
 *     summary: Get public campaign detail
 *     description: Return public detail for a published or ongoing campaign.
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         example: mua-he-xanh-2026
 *     responses:
 *       200:
 *         description: Public campaign detail
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PublicCampaignDetailOutput'
 *       404:
 *         description: Campaign not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotFoundError'
 */
publicRouter.get(
    '/campaigns/:slug',
    validate(publicCampaignSlugSchema),
    publicController.getCampaignBySlug
)

/**
 * @openapi
 * /public/certificates/verify/{certificateNo}:
 *   get:
 *     summary: Verify public certificate
 *     description: Verify a certificate number without authentication. Revoked certificates return success with valid=false.
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: certificateNo
 *         required: true
 *         schema: { type: string }
 *         example: CERT-101-5001
 *     responses:
 *       200:
 *         description: Verification result
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PublicCertificateVerifyOutput'
 */
publicRouter.get(
    '/certificates/verify/:certificateNo',
    validate(publicCertificateVerifySchema),
    publicController.verifyCertificate
)

export default publicRouter
