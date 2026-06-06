import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import * as campaignsController from './campaigns.controller'

const campaignsRouter = Router()

campaignsRouter.use(isAuth)

campaignsRouter.get('/', campaignsController.listCampaigns)
campaignsRouter.post('/', campaignsController.createCampaign)
campaignsRouter.get('/:id', campaignsController.getCampaignDetail)
campaignsRouter.get('/:id/preview', campaignsController.getCampaignPreview)
campaignsRouter.post('/:id/modules', campaignsController.createModule)
campaignsRouter.post('/:id/submit-review', campaignsController.submitCampaign)
campaignsRouter.post('/:id/publish', campaignsController.publishManagedCampaign)
campaignsRouter.delete('/:id', campaignsController.deleteManagedCampaign)

export default campaignsRouter
