import { Router } from 'express'
import { contractList, contractReady } from 'src/modules/_shared/contract-handlers'

const studentsRouter = Router()

studentsRouter.get('/me/dashboard', (_req, res) =>
    contractReady(res, {
        campaigns_count: 0,
        donations_count: 0,
        certificates_count: 0,
        recent_activities: [],
    }, 'Student dashboard contract is ready')
)
studentsRouter.get('/me/activities', (req, res) => contractList(req, res, 'student activities'))
studentsRouter.get('/me/donations', (req, res) => contractList(req, res, 'student donations'))
studentsRouter.get('/me/certificates', (req, res) => contractList(req, res, 'student certificates'))
studentsRouter.patch('/me/profile', (_req, res) =>
    contractReady(res, { updated: true }, 'Student profile contract is ready')
)
studentsRouter.get('/me/titles', (req, res) => contractList(req, res, 'student titles'))

export default studentsRouter

