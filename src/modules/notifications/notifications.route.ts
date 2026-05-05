import { Router } from 'express'
import { contractList, contractReady } from 'src/modules/_shared/contract-handlers'

const notificationsRouter = Router()

notificationsRouter.get('/', (req, res) => contractList(req, res, 'notifications'))
notificationsRouter.patch('/:id/read', (req, res) =>
    contractReady(res, { id: req.params.id, read_at: new Date().toISOString() }, 'Notification marked as read')
)
notificationsRouter.patch('/read-all', (_req, res) =>
    contractReady(res, { updated: true }, 'All notifications marked as read')
)

export default notificationsRouter

