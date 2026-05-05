import { Router, type Request, type Response } from 'express'
import { requireAuth, requireOrgScope, requireRoles } from 'src/common/middleware'
import { contractList, contractReady } from 'src/modules/_shared/contract-handlers'

const organizationsRouter = Router()

organizationsRouter.use(requireAuth, requireRoles(['ORG_ADMIN', 'ORG_MEMBER']))

organizationsRouter.get('/me', (req: Request, res: Response) =>
    contractReady(res, {
        organization_id: req.payload?.organizationId ?? null,
        role: req.payload?.role ?? null,
    }, 'Current organization contract is ready')
)
organizationsRouter.patch(
    '/:id',
    requireOrgScope((req) => String(req.params.id)),
    (req: Request, res: Response) =>
    contractReady(res, { id: req.params.id, updated: true }, 'Organization update contract is ready')
)
organizationsRouter.get(
    '/:id/members',
    requireOrgScope((req) => String(req.params.id)),
    (req: Request, res: Response) => contractList(req, res, 'organization members')
)
organizationsRouter.post(
    '/:id/members',
    requireOrgScope((req) => String(req.params.id)),
    (req: Request, res: Response) =>
    contractReady(res, { organization_id: req.params.id, member: req.body }, 'Organization member create contract is ready')
)
organizationsRouter.patch(
    '/:id/members/:memberId',
    requireOrgScope((req) => String(req.params.id)),
    (req: Request, res: Response) =>
    contractReady(res, { organization_id: req.params.id, member_id: req.params.memberId, updated: true }, 'Organization member update contract is ready')
)
organizationsRouter.get(
    '/:id/join-requests',
    requireOrgScope((req) => String(req.params.id)),
    (req: Request, res: Response) => contractList(req, res, 'organization join requests')
)
organizationsRouter.patch(
    '/:id/join-requests/:requestId',
    requireOrgScope((req) => String(req.params.id)),
    (req: Request, res: Response) =>
    contractReady(res, { organization_id: req.params.id, request_id: req.params.requestId, updated: true }, 'Join request review contract is ready')
)

export default organizationsRouter
