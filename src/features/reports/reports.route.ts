import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import { restrictTo } from 'src/common/middleware/restrictTo'
import * as reportsController from './reports.controller'

const reportsRouter = Router()

reportsRouter.use(isAuth, restrictTo('DOANTRUONG'))

reportsRouter.get('/school/overview', reportsController.getSchoolOverview)
reportsRouter.get('/campaigns/:id', reportsController.getCampaignReport)
reportsRouter.get(
    '/campaigns/:id/reconciliation',
    reportsController.getCampaignReconciliation
)

export default reportsRouter
