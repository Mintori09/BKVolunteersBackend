import { Router } from 'express'
import validate from 'src/common/middleware/validate'
import isAuth from 'src/common/middleware/isAuth'
import * as campaignController from './campaign.controller'
import {
    approveCampaignSchema,
    campaignIdSchema,
    createCampaignModuleSchema,
    createCampaignSchema,
    endCampaignSchema,
    getCampaignsSchema,
    reviewCampaignSchema,
    updateCampaignModuleSchema,
    updateCampaignSchema,
} from './campaign.validation'

const campaignRouter = Router()

campaignRouter.post(
    '/',
    isAuth,
    validate(createCampaignSchema),
    campaignController.createCampaign
)

campaignRouter.get(
    '/',
    isAuth,
    validate(getCampaignsSchema),
    campaignController.getCampaigns
)

campaignRouter.get(
    '/:id',
    isAuth,
    validate(campaignIdSchema),
    campaignController.getCampaign
)

campaignRouter.patch(
    '/:id',
    isAuth,
    validate(updateCampaignSchema),
    campaignController.updateCampaign
)

campaignRouter.post(
    '/:id/submit-review',
    isAuth,
    validate(campaignIdSchema),
    campaignController.submitCampaignForReview
)

campaignRouter.post(
    '/:id/request-revision',
    isAuth,
    validate(reviewCampaignSchema),
    campaignController.requestRevision
)

campaignRouter.post(
    '/:id/approve',
    isAuth,
    validate(approveCampaignSchema),
    campaignController.approveCampaign
)

campaignRouter.post(
    '/:id/publish',
    isAuth,
    validate(campaignIdSchema),
    campaignController.publishCampaign
)

campaignRouter.post(
    '/:id/end',
    isAuth,
    validate(endCampaignSchema),
    campaignController.endCampaign
)

campaignRouter.post(
    '/:id/modules',
    isAuth,
    validate(createCampaignModuleSchema),
    campaignController.createCampaignModule
)

campaignRouter.patch(
    '/:id/modules/:moduleId',
    isAuth,
    validate(updateCampaignModuleSchema),
    campaignController.updateCampaignModule
)

export default campaignRouter
