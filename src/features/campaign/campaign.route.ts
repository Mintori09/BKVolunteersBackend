import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import validate from 'src/common/middleware/validate'
import * as campaignController from './campaign.controller'
import {
    campaignCertificateLayoutSchema,
    campaignLifecycleSchema,
    createDraftCampaignSchema,
    createOrganizerCampaignSchema,
    exportOrganizerCampaignSchema,
    organizerCampaignCertificateTemplateParamsValidationSchema,
    organizerCampaignDocumentParamsValidationSchema,
    organizerCampaignParamsValidationSchema,
    sendCampaignCertificateEmailsSchema,
    upsertGeneratedCampaignCertificatesSchema,
    updateDraftCampaignSchema,
    updateOrganizerCampaignSchema,
} from './campaign.validation'

const campaignRouter = Router()

campaignRouter.get('/bootstrap', isAuth, campaignController.getOrganizerCampaignBootstrap)

campaignRouter.get(
    '/drafts/bootstrap',
    isAuth,
    campaignController.getDraftBootstrap
)

campaignRouter.get('/drafts/:id', isAuth, campaignController.getDraftCampaign)

campaignRouter.post(
    '/drafts',
    isAuth,
    validate(createDraftCampaignSchema),
    campaignController.handleCreateDraftCampaign
)

campaignRouter.patch(
    '/drafts/:id',
    isAuth,
    validate(updateDraftCampaignSchema),
    campaignController.handleUpdateDraftCampaign
)

campaignRouter.get('/', isAuth, campaignController.listOrganizerCampaigns)

campaignRouter.post(
    '/',
    isAuth,
    validate(createOrganizerCampaignSchema),
    campaignController.createOrganizerCampaign
)

campaignRouter.get(
    '/:id/workspace',
    isAuth,
    validate(organizerCampaignParamsValidationSchema),
    campaignController.getOrganizerCampaignWorkspace
)

campaignRouter.get(
    '/:id/documents/:documentId/download',
    isAuth,
    validate(organizerCampaignDocumentParamsValidationSchema),
    campaignController.downloadOrganizerCampaignDocument
)

campaignRouter.get(
    '/:id/certificates/template/:phaseId/download',
    isAuth,
    validate(organizerCampaignCertificateTemplateParamsValidationSchema),
    campaignController.downloadOrganizerCampaignCertificateTemplate
)

campaignRouter.patch(
    '/:id/certificates/layout',
    isAuth,
    validate(campaignCertificateLayoutSchema),
    campaignController.updateCampaignCertificateLayout
)

campaignRouter.post(
    '/:id/certificates/emails/send',
    isAuth,
    validate(sendCampaignCertificateEmailsSchema),
    campaignController.sendCampaignCertificateEmails
)

campaignRouter.post(
    '/:id/certificates/generated/upsert',
    isAuth,
    validate(upsertGeneratedCampaignCertificatesSchema),
    campaignController.upsertGeneratedCampaignCertificates
)

campaignRouter.post(
    '/:id/export',
    isAuth,
    validate(exportOrganizerCampaignSchema),
    campaignController.exportOrganizerCampaign
)

campaignRouter.patch(
    '/:id/submit',
    isAuth,
    validate(organizerCampaignParamsValidationSchema),
    campaignController.submitOrganizerCampaign
)

campaignRouter.patch(
    '/:id/approve',
    isAuth,
    validate(organizerCampaignParamsValidationSchema),
    campaignController.approveOrganizerCampaign
)

campaignRouter.patch(
    '/:id/publish',
    isAuth,
    validate(organizerCampaignParamsValidationSchema),
    campaignController.publishOrganizerCampaign
)

campaignRouter.patch(
    '/:id/lifecycle',
    isAuth,
    validate(campaignLifecycleSchema),
    campaignController.updateCampaignLifecycle
)

campaignRouter.get(
    '/:id',
    isAuth,
    validate(organizerCampaignParamsValidationSchema),
    campaignController.getOrganizerCampaignDetail
)

campaignRouter.patch(
    '/:id',
    isAuth,
    validate(updateOrganizerCampaignSchema),
    campaignController.updateOrganizerCampaign
)

campaignRouter.delete(
    '/:id',
    isAuth,
    validate(organizerCampaignParamsValidationSchema),
    campaignController.deleteOrganizerCampaign
)

export default campaignRouter
