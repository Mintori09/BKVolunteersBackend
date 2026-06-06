import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import { restrictTo } from 'src/common/middleware/restrictTo'
import * as organizationsAdminController from './organizations.admin.controller'

const adminOrganizationsRouter = Router()

adminOrganizationsRouter.use(isAuth, restrictTo('DOANTRUONG'))

adminOrganizationsRouter.get(
    '/',
    organizationsAdminController.listAdminOrganizations
)
adminOrganizationsRouter.post(
    '/',
    organizationsAdminController.createAdminOrganization
)
adminOrganizationsRouter.patch(
    '/:id',
    organizationsAdminController.updateAdminOrganization
)
adminOrganizationsRouter.delete(
    '/:id',
    organizationsAdminController.deleteAdminOrganization
)

export default adminOrganizationsRouter
