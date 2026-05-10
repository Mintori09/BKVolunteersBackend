import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import validate from 'src/common/middleware/validate'
import * as approvalsController from './approvals.controller'
import { approvalQueueSchema } from './approvals.validation'

const approvalsRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Approvals
 *   description: Canonical campaign approval queue
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ApprovalQueueItemOutput:
 *       type: object
 *       required: [id, title, slug, summary, scope_type, status, organization, faculty, created_by, last_review, last_activity, updated_at]
 *       properties:
 *         id: { type: integer, example: 101 }
 *         title: { type: string, example: "Mua he xanh 2026" }
 *         slug: { type: string, example: "mua-he-xanh-2026" }
 *         summary: { type: string, nullable: true }
 *         scope_type: { type: string, example: "SCHOOL" }
 *         status: { type: string, example: "SUBMITTED" }
 *         organization: { nullable: true }
 *         faculty: { nullable: true }
 *         created_by: { nullable: true }
 *         last_review: { nullable: true }
 *         last_activity: { nullable: true }
 *         updated_at: { type: string, format: date-time }
 *     ApprovalQueueOutput:
 *       type: object
 *       required: [items, pagination]
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ApprovalQueueItemOutput'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationMeta'
 */

/**
 * @openapi
 * /approvals:
 *   get:
 *     summary: List approval queue
 *     description: Return scoped approval queue for operator principals. Non-DOANTRUONG operators are limited to their organization or faculty.
 *     tags: [Approvals]
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
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: organization_id
 *         schema: { type: integer }
 *       - in: query
 *         name: faculty_id
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Approval queue page
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ApprovalQueueOutput'
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
approvalsRouter.get(
    '/',
    isAuth,
    validate(approvalQueueSchema),
    approvalsController.getApprovalQueue
)

export default approvalsRouter
