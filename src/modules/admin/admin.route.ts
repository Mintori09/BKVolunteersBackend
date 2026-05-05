import { Router } from 'express'
import { requireAuth, requireRoles } from 'src/common/middleware'
import { contractList, contractMutation, contractReady } from 'src/modules/_shared/contract-handlers'

const adminRouter = Router()

adminRouter.use(requireAuth, requireRoles(['SCHOOL_ADMIN']))

adminRouter.get('/faculties', (req, res) => contractList(req, res, 'faculties'))
adminRouter.post('/faculties', (req, res) => contractMutation(req, res, 'faculty', 'ACTIVE'))
adminRouter.patch('/faculties/:id', (req, res) =>
    contractReady(res, { id: req.params.id, updated: true }, 'Faculty update contract is ready')
)
adminRouter.get('/organizations', (req, res) => contractList(req, res, 'organizations'))
adminRouter.post('/organizations', (req, res) => contractMutation(req, res, 'organization', 'ACTIVE'))
adminRouter.patch('/organizations/:id', (req, res) =>
    contractReady(res, { id: req.params.id, updated: true }, 'Organization admin update contract is ready')
)
adminRouter.get('/audit-logs', (req, res) => contractList(req, res, 'audit logs'))

export default adminRouter
