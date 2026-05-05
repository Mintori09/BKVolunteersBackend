import { Router } from 'express'
import { contractReady } from 'src/modules/_shared/contract-handlers'

const reportsRouter = Router()

reportsRouter.get('/campaigns/:id', (req, res) =>
    contractReady(res, { campaign_id: req.params.id, metrics: {} }, 'Campaign report contract is ready')
)
reportsRouter.get('/organizations/:id', (req, res) =>
    contractReady(res, { organization_id: req.params.id, metrics: {} }, 'Organization report contract is ready')
)
reportsRouter.get('/school/overview', (_req, res) =>
    contractReady(res, { metrics: {} }, 'School overview report contract is ready')
)

export default reportsRouter

