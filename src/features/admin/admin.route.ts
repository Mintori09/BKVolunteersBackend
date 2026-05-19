import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import { restrictTo } from 'src/common/middleware/restrictTo'
import validate from 'src/common/middleware/validate'
import * as adminController from './admin.controller'
import * as adminOrgController from './admin-org.controller'
import {
    createAdminOrganizationSchema,
    deleteAdminOrganizationSchema,
    listAuditLogsSchema,
    listBackgroundJobsSchema,
    updateAdminOrganizationSchema,
} from './admin.validation'

const adminRouter = Router()

adminRouter.use(isAuth)
adminRouter.use(restrictTo('OPERATOR'))

/**
 * @openapi
 * tags:
 *   name: Admin
 *   description: Administrative audit and queue endpoints
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     AdminAuditLogOutput:
 *       type: object
 *       required: [id, actor_type, actor_id, action, entity_type, entity_id, before_json, after_json, ip_address, created_at]
 *       properties:
 *         id: { type: integer, example: 1 }
 *         actor_type: { type: string, example: "OPERATOR" }
 *         actor_id: { type: integer, example: 20 }
 *         action: { type: string, example: "CAMPAIGN_APPROVED" }
 *         entity_type: { type: string, example: "campaign" }
 *         entity_id: { type: integer, example: 101 }
 *         before_json: { nullable: true }
 *         after_json: { nullable: true }
 *         ip_address: { type: string, nullable: true, example: "127.0.0.1" }
 *         created_at: { type: string, format: date-time }
 *     AdminAuditLogListOutput:
 *       type: object
 *       required: [items, pagination]
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdminAuditLogOutput'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationMeta'
 *     AdminBackgroundJobOutput:
 *       type: object
 *       required: [id, type, status, payload_json, attempts, last_error, run_at, locked_at, created_at, updated_at]
 *       properties:
 *         id: { type: integer, example: 2001 }
 *         type: { type: string, example: "RENDER_CERTIFICATE" }
 *         status: { type: string, example: "PENDING" }
 *         payload_json: {}
 *         attempts: { type: integer, example: 0 }
 *         last_error: { type: string, nullable: true }
 *         run_at: { type: string, format: date-time }
 *         locked_at: { type: string, format: date-time, nullable: true }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *     AdminBackgroundJobListOutput:
 *       type: object
 *       required: [items, pagination]
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdminBackgroundJobOutput'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationMeta'
 */

/**
 * @openapi
 * /admin/audit-logs:
 *   get:
 *     summary: List audit logs
 *     description: Return paginated canonical audit logs with optional actor/entity filters.
 *     tags: [Admin]
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
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: entity_type
 *         schema: { type: string }
 *       - in: query
 *         name: entity_id
 *         schema: { type: integer }
 *       - in: query
 *         name: actor_type
 *         schema: { type: string }
 *       - in: query
 *         name: actor_id
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Audit log page
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AdminAuditLogListOutput'
 *       400:
 *         description: Invalid query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenError'
 */
adminRouter.get(
    '/audit-logs',
    validate(listAuditLogsSchema),
    adminController.listAuditLogs
)

/**
 * @openapi
 * /admin/background-jobs:
 *   get:
 *     summary: List background jobs
 *     description: Return paginated background jobs queue with optional type and status filters.
 *     tags: [Admin]
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
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Background job page
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AdminBackgroundJobListOutput'
 *       400:
 *         description: Invalid query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenError'
 */
adminRouter.get(
    '/background-jobs',
    validate(listBackgroundJobsSchema),
    adminController.listBackgroundJobs
)

/**
 * @openapi
 * /admin/organizations:
 *   get:
 *     summary: List all organizations
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization list
 *   post:
 *     summary: Create organization
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminCreateOrganizationBody'
 *     responses:
 *       201:
 *         description: Organization created
 */
adminRouter.get('/organizations', adminOrgController.listOrganizations)

adminRouter.post(
    '/organizations',
    validate(createAdminOrganizationSchema),
    adminOrgController.createOrganization
)

/**
 * @openapi
 * /admin/organizations/{id}:
 *   patch:
 *     summary: Update organization
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Organization updated
 *   delete:
 *     summary: Soft delete organization
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Organization deleted
 */
adminRouter.patch(
    '/organizations/:id',
    validate(updateAdminOrganizationSchema),
    adminOrgController.updateOrganization
)

adminRouter.delete(
    '/organizations/:id',
    validate(deleteAdminOrganizationSchema),
    adminOrgController.deleteOrganization
)

export default adminRouter
