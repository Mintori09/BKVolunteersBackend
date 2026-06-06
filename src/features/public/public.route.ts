import { Router } from 'express'
import { verifyCertificate } from 'src/features/certificates/certificates.controller'
import * as publicController from './public.controller'

const publicRouter = Router()

publicRouter.get('/campaigns', publicController.listPublicCampaigns)
publicRouter.get('/campaigns/:slug', publicController.getPublicCampaignDetail)
publicRouter.get('/certificates/verify/:code', verifyCertificate)

export default publicRouter
