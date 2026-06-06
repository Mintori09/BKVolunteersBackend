import { Router } from 'express'
import * as organizationsController from './organizations.controller'

const organizationsRouter = Router()

organizationsRouter.get('/', organizationsController.listOrganizations)
organizationsRouter.get('/:slug', organizationsController.getOrganizationDetail)

export default organizationsRouter
