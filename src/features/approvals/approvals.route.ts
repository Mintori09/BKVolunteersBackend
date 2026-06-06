import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import { restrictTo } from 'src/common/middleware/restrictTo'
import * as approvalsController from './approvals.controller'

const approvalsRouter = Router()

approvalsRouter.use(isAuth, restrictTo('DOANTRUONG'))

approvalsRouter.get('/campaigns', approvalsController.listApprovalCampaigns)
approvalsRouter.get('/campaigns/:id', approvalsController.getApprovalCampaignDetail)
approvalsRouter.post('/campaigns/:id/comments', approvalsController.addApprovalComment)
approvalsRouter.post(
    '/campaigns/:id/:action',
    approvalsController.approvalTransition
)

export default approvalsRouter
