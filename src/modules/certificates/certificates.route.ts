import { Router } from 'express'
import { contractList, contractMutation, contractReady } from 'src/modules/_shared/contract-handlers'

const certificatesRouter = Router()

certificatesRouter.get('/templates', (req, res) => contractList(req, res, 'certificate templates'))
certificatesRouter.post('/templates', (req, res) => contractMutation(req, res, 'certificate_template', 'ACTIVE'))
certificatesRouter.post('/campaigns/:campaignId/generate', (req, res) =>
    contractReady(res, { campaign_id: req.params.campaignId, certificates: [], dry_run: Boolean(req.body?.dry_run) }, 'Certificate generation contract is ready')
)
certificatesRouter.post('/:id/render', (req, res) => contractMutation(req, res, 'certificate', 'RENDERING'))
certificatesRouter.get('/:id/download', (req, res) =>
    contractReady(res, { id: req.params.id, file_url: null }, 'Certificate download contract is ready')
)
certificatesRouter.post('/:id/revoke', (req, res) => contractMutation(req, res, 'certificate', 'REVOKED'))
certificatesRouter.post('/:id/reissue', (req, res) =>
    contractReady(res, { old_certificate_id: req.params.id, replacement_certificate_id: null }, 'Certificate reissue contract is ready')
)

export default certificatesRouter

