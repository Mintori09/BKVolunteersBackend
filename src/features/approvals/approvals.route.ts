import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import validate from 'src/common/middleware/validate'
import * as approvalsController from './approvals.controller'
import {
    approvalQueueSchema,
    approvalIdSchema,
    approvalActionSchema,
    approvalCommentSchema,
} from './approvals.validation'

const approvalsRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Approvals
 *   description: Canonical campaign approval queue
 */

/**
 * @openapi
 * /approvals:
 *   get:
 *     summary: List approval queue
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
 */
approvalsRouter.get(
    '/',
    isAuth,
    validate(approvalQueueSchema),
    approvalsController.getApprovalQueue
)

approvalsRouter.get(
    '/campaigns',
    isAuth,
    validate(approvalQueueSchema),
    approvalsController.getApprovalQueueItems
)

/**
 * GET /approvals/campaigns/:id - Campaign approval detail
 */
approvalsRouter.get(
    '/campaigns/:id',
    isAuth,
    validate(approvalIdSchema),
    approvalsController.getApprovalCampaignDetail
)

/**
 * POST /approvals/campaigns/:id/comments - Add approval comment
 */
approvalsRouter.post(
    '/campaigns/:id/comments',
    isAuth,
    validate(approvalCommentSchema),
    approvalsController.addApprovalComment
)

/**
 * POST /approvals/campaigns/:id/request-revision
 */
approvalsRouter.post(
    '/campaigns/:id/request-revision',
    isAuth,
    validate(approvalActionSchema),
    approvalsController.requestRevision
)

/**
 * POST /approvals/campaigns/:id/pre-approve
 */
approvalsRouter.post(
    '/campaigns/:id/pre-approve',
    isAuth,
    validate(approvalActionSchema),
    approvalsController.preApproveCampaign
)

/**
 * POST /approvals/campaigns/:id/approve
 */
approvalsRouter.post(
    '/campaigns/:id/approve',
    isAuth,
    validate(approvalActionSchema),
    approvalsController.approveCampaign
)

/**
 * POST /approvals/campaigns/:id/reject
 */
approvalsRouter.post(
    '/campaigns/:id/reject',
    isAuth,
    validate(approvalActionSchema),
    approvalsController.rejectCampaign
)

export default approvalsRouter
