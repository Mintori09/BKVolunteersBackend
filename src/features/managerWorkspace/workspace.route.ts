import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import validate from 'src/common/middleware/validate'
import * as workspaceController from './workspace.controller'
import {
    exportWorkspaceReportSchema,
    reviewContributionSchema,
    reviewRegistrationSchema,
    updateMembershipStatusSchema,
    workspaceEntityParamsSchema,
} from './workspace.validation'

const managerWorkspaceRouter = Router()

managerWorkspaceRouter.get('/', isAuth, workspaceController.getManagerWorkspace)

managerWorkspaceRouter.patch(
    '/memberships/:id',
    isAuth,
    validate(updateMembershipStatusSchema),
    workspaceController.handleUpdateMembershipStatus
)

managerWorkspaceRouter.patch(
    '/registrations/:id/review',
    isAuth,
    validate(reviewRegistrationSchema),
    workspaceController.handleReviewRegistration
)

managerWorkspaceRouter.patch(
    '/contributions/:id/review',
    isAuth,
    validate(reviewContributionSchema),
    workspaceController.handleReviewContribution
)

managerWorkspaceRouter.patch(
    '/campaigns/:id/submit',
    isAuth,
    validate(workspaceEntityParamsSchema),
    workspaceController.handleSubmitCampaign
)

managerWorkspaceRouter.patch(
    '/campaigns/:id/approve',
    isAuth,
    validate(workspaceEntityParamsSchema),
    workspaceController.handleApproveCampaign
)

managerWorkspaceRouter.patch(
    '/campaigns/:id/publish',
    isAuth,
    validate(workspaceEntityParamsSchema),
    workspaceController.handlePublishCampaign
)

managerWorkspaceRouter.post(
    '/reports/export',
    isAuth,
    validate(exportWorkspaceReportSchema),
    workspaceController.handleExportWorkspaceReport
)

export default managerWorkspaceRouter
