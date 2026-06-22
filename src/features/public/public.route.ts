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
 *     PublicCampaignListItemOutput:
 *       type: object
 *       required: [id, slug, title, summary, cover_image_url, beneficiary, scope_type, start_at, end_at, status]
 *       properties:
 *         id: { type: integer, example: 101 }
 *         slug: { type: string, example: "mua-he-xanh-2026" }
 *         title: { type: string, example: "Mua he xanh 2026" }
 *         summary: { type: string, nullable: true, example: "Chuong trinh tinh nguyen mua he" }
 *         cover_image_url: { type: string, nullable: true, example: "https://cdn.example.com/campaigns/101.jpg" }
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
 *             modules:
 *               type: array
 *               items:
 *                 type: object
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
