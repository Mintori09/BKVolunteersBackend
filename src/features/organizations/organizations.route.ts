import { Router } from 'express'
import validate from 'src/common/middleware/validate'
import * as organizationsController from './organizations.controller'
import {
    listOrganizationsSchema,
    organizationSlugSchema,
} from './organizations.validation'

const organizationsRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Organizations
 *   description: Canonical organization directory
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     OrganizationFacultySummary:
 *       type: object
 *       required: [id, code, name]
 *       properties:
 *         id: { type: integer, example: 1 }
 *         code: { type: string, example: "CNTT" }
 *         name: { type: string, example: "Cong nghe thong tin" }
 *     OrganizationListItemOutput:
 *       type: object
 *       required: [id, code, name, type, status, faculty]
 *       properties:
 *         id: { type: integer, example: 10 }
 *         code: { type: string, example: "CLB-ITV" }
 *         name: { type: string, example: "CLB Tinh nguyen CNTT" }
 *         type: { type: string, example: "CLUB" }
 *         status: { type: string, example: "ACTIVE" }
 *         faculty:
 *           oneOf:
 *             - $ref: '#/components/schemas/OrganizationFacultySummary'
 *             - type: 'null'
 *     OrganizationListOutput:
 *       type: object
 *       required: [items]
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrganizationListItemOutput'
 */

/**
 * @openapi
 * /organizations:
 *   get:
 *     summary: List organizations
 *     description: Return canonical organizations with attached faculty summary when available.
 *     tags: [Organizations]
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         example: 20
 *     responses:
 *       200:
 *         description: Organization list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/OrganizationListOutput'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: Success
 *                   data:
 *                     items:
 *                       - id: 10
 *                         code: CLB-ITV
 *                         name: CLB Tinh nguyen CNTT
 *                         type: CLUB
 *                         status: ACTIVE
 *                         faculty:
 *                           id: 1
 *                           code: CNTT
 *                           name: Cong nghe thong tin
 *       400:
 *         description: Invalid query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
organizationsRouter.get(
    '/',
    validate(listOrganizationsSchema),
    organizationsController.listOrganizations
)

/**
 * @openapi
 * /organizations/{slug}:
 *   get:
 *     summary: Get organization by slug
 *     description: Return organization detail with faculty summary and active campaigns.
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Organization detail
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/OrganizationDetailOutput'
 *       404:
 *         description: Organization not found
 */
organizationsRouter.get(
    '/:slug',
    validate(organizationSlugSchema),
    organizationsController.getOrganizationBySlug
)

export default organizationsRouter
