import { Router } from 'express'
import { contractMutation, contractReady } from 'src/modules/_shared/contract-handlers'

const eventsRouter = Router()

eventsRouter.patch('/modules/:moduleId/config', (req, res) =>
    contractReady(res, { module_id: req.params.moduleId, config: req.body }, 'Event module config contract is ready')
)
eventsRouter.post('/modules/:moduleId/registrations', (req, res) => contractMutation(req, res, 'event_registration', 'PENDING'))
eventsRouter.patch('/registrations/:id/approve', (req, res) => contractMutation(req, res, 'event_registration', 'APPROVED'))
eventsRouter.patch('/registrations/:id/reject', (req, res) => contractMutation(req, res, 'event_registration', 'REJECTED'))
eventsRouter.post('/registrations/:id/check-in', (req, res) => contractMutation(req, res, 'event_registration', 'CHECKED_IN'))
eventsRouter.post('/registrations/:id/complete', (req, res) => contractMutation(req, res, 'event_registration', 'COMPLETED'))

export default eventsRouter

