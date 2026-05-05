import { Router } from 'express'
import { contractList, contractMutation, contractReady } from 'src/modules/_shared/contract-handlers'

const itemDonationsRouter = Router()

itemDonationsRouter.patch('/modules/:moduleId/config', (req, res) =>
    contractReady(res, { module_id: req.params.moduleId, config: req.body }, 'Item donation config contract is ready')
)
itemDonationsRouter.post('/modules/:moduleId/targets', (req, res) => contractMutation(req, res, 'item_target', 'ACTIVE'))
itemDonationsRouter.patch('/targets/:targetId', (req, res) =>
    contractReady(res, { target_id: req.params.targetId, updated: true }, 'Item target update contract is ready')
)
itemDonationsRouter.post('/modules/:moduleId/pledges', (req, res) => contractMutation(req, res, 'item_pledge', 'PLEDGED'))
itemDonationsRouter.get('/modules/:moduleId/pledges', (req, res) => contractList(req, res, 'item pledges'))
itemDonationsRouter.patch('/pledges/:id/confirm', (req, res) => contractMutation(req, res, 'item_pledge', 'CONFIRMED'))
itemDonationsRouter.patch('/pledges/:id/reject', (req, res) => contractMutation(req, res, 'item_pledge', 'REJECTED'))
itemDonationsRouter.post('/pledges/:id/handover', (req, res) => contractMutation(req, res, 'item_pledge', 'RECEIVED'))

export default itemDonationsRouter

