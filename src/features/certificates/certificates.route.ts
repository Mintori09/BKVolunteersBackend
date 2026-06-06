import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import { restrictTo } from 'src/common/middleware/restrictTo'
import * as certificatesController from './certificates.controller'

const certificatesRouter = Router()

certificatesRouter.use(isAuth, restrictTo('DOANTRUONG'))

certificatesRouter.get('/templates', certificatesController.getTemplates)
certificatesRouter.post('/templates', certificatesController.createTemplate)
certificatesRouter.patch('/templates/:id', certificatesController.updateTemplate)
certificatesRouter.delete('/templates/:id', certificatesController.deactivateTemplate)
certificatesRouter.get(
    '/campaigns/:campaignId',
    certificatesController.listCampaignCertificates
)
certificatesRouter.post(
    '/campaigns/:campaignId/generate',
    certificatesController.generateCampaignCertificates
)
certificatesRouter.post('/:id/render', certificatesController.renderCertificate)
certificatesRouter.get('/:id/download', certificatesController.getCertificateDownload)
certificatesRouter.post('/:id/revoke', certificatesController.revokeCertificate)
certificatesRouter.post('/:id/reissue', certificatesController.reissueCertificate)

export default certificatesRouter
