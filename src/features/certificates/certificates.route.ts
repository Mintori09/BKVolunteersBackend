import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import validate from 'src/common/middleware/validate'
import * as certificatesController from './certificates.controller'
import {
    certificateCampaignSchema,
    certificateIdSchema,
    certificateTemplateIdSchema,
    createCertificateTemplateSchema,
    generateCertificatesSchema,
    revokeCertificateSchema,
    updateCertificateTemplateSchema,
} from './certificates.validation'

const certificatesRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Certificates
 *   description: Canonical certificate endpoints
 * components:
 *   schemas:
 *     CertificateTemplateOutput:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         name: { type: string, example: Chứng nhận hoàn thành chiến dịch }
 *         type: { type: string, nullable: true, example: CAMPAIGN_COMPLETION }
 *         file_url: { type: string, nullable: true }
 *         layout_json: { type: object, nullable: true }
 *         status: { type: string, example: ACTIVE }
 *         created_by: { type: integer, nullable: true }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *     CreateCertificateTemplateBody:
 *       type: object
 *       required: [name]
 *       properties:
 *         name: { type: string, example: Chứng nhận tình nguyện viên }
 *         type: { type: string, example: CAMPAIGN_COMPLETION }
 *         file_url: { type: string, nullable: true }
 *         layout_json: { type: object, additionalProperties: true }
 *     CertificateOutput:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 3001 }
 *         certificate_no: { type: string, example: CERT-7-42 }
 *         campaign_id: { type: integer, example: 7 }
 *         module_id: { type: integer, nullable: true }
 *         student_id: { type: integer, example: 42 }
 *         template_id: { type: integer, example: 1 }
 *         status: { type: string, example: PENDING }
 *         snapshot_json: { type: object, nullable: true }
 *         file_url: { type: string, nullable: true }
 *         file_hash: { type: string, nullable: true }
 *         issued_at: { type: string, format: date-time, nullable: true }
 *         revoked_at: { type: string, format: date-time, nullable: true }
 *         revoked_by: { type: integer, nullable: true }
 *         revoke_reason: { type: string, nullable: true }
 *         replacement_certificate_id: { type: integer, nullable: true }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *     GenerateCertificatesBody:
 *       type: object
 *       properties:
 *         template_id: { type: string, example: '1' }
 *         templateId: { type: string, example: '1' }
 *         module_id: { type: string, example: '31' }
 *     GenerateCertificatesOutput:
 *       type: object
 *       properties:
 *         created_count: { type: integer, example: 24 }
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CertificateOutput'
 *     RenderCertificateOutput:
 *       type: object
 *       properties:
 *         queued: { type: boolean, example: true }
 *         certificate_id: { type: integer, example: 3001 }
 *     DownloadCertificateOutput:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 3001 }
 *         certificate_no: { type: string, example: CERT-7-42 }
 *         file_url: { type: string, nullable: true }
 *         status: { type: string, example: ISSUED }
 *     RevokeCertificateBody:
 *       type: object
 *       properties:
 *         reason: { type: string, example: Sai thông tin sinh viên }
 *         revoke_reason: { type: string, example: Sai thông tin sinh viên }
 */

/**
 * @openapi
 * /certificates/templates:
 *   get:
 *     summary: List certificate templates
 *     tags: [Certificates]
 *     responses:
 *       200:
 *         description: Template list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CertificateTemplateOutput'
 *   post:
 *     summary: Create certificate template
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCertificateTemplateBody'
 *     responses:
 *       201:
 *         description: Template created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CertificateTemplateOutput'
 */
certificatesRouter.get('/templates', certificatesController.listTemplates)

certificatesRouter.post(
    '/templates',
    isAuth,
    validate(createCertificateTemplateSchema),
    certificatesController.createTemplate
)

certificatesRouter.patch(
    '/templates/:id',
    isAuth,
    validate(updateCertificateTemplateSchema),
    certificatesController.updateTemplate
)

certificatesRouter.delete(
    '/templates/:id',
    isAuth,
    validate(certificateTemplateIdSchema),
    certificatesController.deleteTemplate
)

/**
 * @openapi
 * /certificates/campaigns/{campaignId}/generate:
 *   post:
 *     summary: Generate campaign certificates
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateCertificatesBody'
 *     responses:
 *       200:
 *         description: Certificates generated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/GenerateCertificatesOutput'
 */
certificatesRouter.post(
    '/campaigns/:campaignId/generate',
    isAuth,
    validate(generateCertificatesSchema),
    certificatesController.generateCertificates
)

/**
 * @openapi
 * /certificates/campaigns/{campaignId}:
 *   get:
 *     summary: List certificates for a campaign
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Campaign certificate list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CertificateOutput'
 */
certificatesRouter.get(
    '/campaigns/:campaignId',
    isAuth,
    validate(certificateCampaignSchema),
    certificatesController.listCampaignCertificates
)

/**
 * @openapi
 * /certificates/{id}/render:
 *   post:
 *     summary: Queue certificate rendering
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Render job queued
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/RenderCertificateOutput'
 */
certificatesRouter.post(
    '/:id/render',
    isAuth,
    validate(certificateIdSchema),
    certificatesController.renderCertificate
)

/**
 * @openapi
 * /certificates/{id}/download:
 *   get:
 *     summary: Get certificate download metadata
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Certificate download info
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DownloadCertificateOutput'
 */
certificatesRouter.get(
    '/:id/download',
    validate(certificateIdSchema),
    certificatesController.downloadCertificate
)

/**
 * @openapi
 * /certificates/{id}/revoke:
 *   post:
 *     summary: Revoke certificate
 *     tags: [Certificates]
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
 *             $ref: '#/components/schemas/RevokeCertificateBody'
 *     responses:
 *       200:
 *         description: Certificate revoked
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CertificateOutput'
 */
certificatesRouter.post(
    '/:id/revoke',
    isAuth,
    validate(revokeCertificateSchema),
    certificatesController.revokeCertificate
)

/**
 * @openapi
 * /certificates/{id}/reissue:
 *   post:
 *     summary: Reissue certificate
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Replacement certificate created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CertificateOutput'
 */
certificatesRouter.post(
    '/:id/reissue',
    isAuth,
    validate(certificateIdSchema),
    certificatesController.reissueCertificate
)

export default certificatesRouter
