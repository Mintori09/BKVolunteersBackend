import { Router } from 'express'
import validate from 'src/common/middleware/validate'
import isAuth from 'src/common/middleware/isAuth'
import { restrictTo } from 'src/common/middleware/restrictTo'
import * as campaignController from './campaign.controller'
import {
    createCampaignSchema,
    updateCampaignSchema,
    campaignIdSchema,
    approveCampaignSchema,
    rejectCampaignSchema,
    completeCampaignSchema,
    uploadPlanFileSchema,
    uploadBudgetFileSchema,
    getCampaignsSchema,
    getAvailableCampaignsSchema,
} from './campaign.validation'

const campaignRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Campaign
 *   description: Campaign management
 */

/**
 * @openapi
 * /campaigns:
 *   post:
 *     summary: Create a new campaign
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - scope
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               scope:
 *                 type: string
 *                 enum: [KHOA, TRUONG]
 *               facultyId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
campaignRouter.post(
    '/',
    isAuth,
    validate(createCampaignSchema),
    campaignController.createCampaign
)

/**
 * @openapi
 * /campaigns:
 *   get:
 *     summary: Get campaigns with filters
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PENDING, ACTIVE, REJECTED, COMPLETED, CANCELLED]
 *       - in: query
 *         name: scope
 *         schema:
 *           type: string
 *           enum: [KHOA, TRUONG]
 *       - in: query
 *         name: facultyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 */
campaignRouter.get(
    '/',
    isAuth,
    validate(getCampaignsSchema),
    campaignController.getCampaigns
)

/**
 * @openapi
 * /campaigns/available:
 *   get:
 *     summary: Get available campaigns for students
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 */
campaignRouter.get(
    '/available',
    isAuth,
    validate(getAvailableCampaignsSchema),
    campaignController.getAvailableCampaigns
)

/**
 * @openapi
 * /campaigns/{id}:
 *   get:
 *     summary: Get campaign by ID
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found
 */
campaignRouter.get(
    '/:id',
    isAuth,
    validate(campaignIdSchema),
    campaignController.getCampaign
)

/**
 * @openapi
 * /campaigns/{id}:
 *   put:
 *     summary: Update campaign
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
campaignRouter.put(
    '/:id',
    isAuth,
    validate(updateCampaignSchema),
    campaignController.updateCampaign
)

/**
 * @openapi
 * /campaigns/{id}:
 *   delete:
 *     summary: Delete campaign
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
campaignRouter.delete(
    '/:id',
    isAuth,
    validate(campaignIdSchema),
    campaignController.deleteCampaign
)

/**
 * @openapi
 * /campaigns/{id}/submit:
 *   post:
 *     summary: Submit campaign for approval
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
campaignRouter.post(
    '/:id/submit',
    isAuth,
    validate(campaignIdSchema),
    campaignController.submitCampaign
)

/**
 * @openapi
 * /campaigns/{id}/approve:
 *   post:
 *     summary: Approve campaign
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
campaignRouter.post(
    '/:id/approve',
    isAuth,
    restrictTo('DOANTRUONG'),
    validate(approveCampaignSchema),
    campaignController.approveCampaign
)

/**
 * @openapi
 * /campaigns/{id}/reject:
 *   post:
 *     summary: Reject campaign
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
campaignRouter.post(
    '/:id/reject',
    isAuth,
    restrictTo('DOANTRUONG'),
    validate(rejectCampaignSchema),
    campaignController.rejectCampaign
)

/**
 * @openapi
 * /campaigns/{id}/complete:
 *   post:
 *     summary: Mark campaign as completed
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventPhotos:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
campaignRouter.post(
    '/:id/complete',
    isAuth,
    validate(completeCampaignSchema),
    campaignController.completeCampaign
)

/**
 * @openapi
 * /campaigns/{id}/cancel:
 *   post:
 *     summary: Cancel campaign
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
campaignRouter.post(
    '/:id/cancel',
    isAuth,
    validate(campaignIdSchema),
    campaignController.cancelCampaign
)

/**
 * @openapi
 * /campaigns/{id}/plan-file:
 *   post:
 *     summary: Upload plan file
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planFileUrl
 *             properties:
 *               planFileUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
campaignRouter.post(
    '/:id/plan-file',
    isAuth,
    validate(uploadPlanFileSchema),
    campaignController.uploadPlanFile
)

/**
 * @openapi
 * /campaigns/{id}/budget-file:
 *   post:
 *     summary: Upload budget file
 *     tags: [Campaign]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - budgetFileUrl
 *             properties:
 *               budgetFileUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
campaignRouter.post(
    '/:id/budget-file',
    isAuth,
    validate(uploadBudgetFileSchema),
    campaignController.uploadBudgetFile
)

export default campaignRouter
