import { Router } from 'express'
import {
    adminRouter,
    approvalsRouter,
    authRouter,
    campaignsRouter,
    certificatesRouter,
    eventsRouter,
    fundraisingRouter,
    itemDonationsRouter,
    notificationsRouter,
    organizationsRouter,
    publicRouter,
    reportsRouter,
    studentsRouter,
} from 'src/modules'
import { ApiResponse } from 'src/utils/ApiResponse'

const router = Router()
const serviceName = 'express-starter-kit'
const serviceVersion = '1.0.0'

router.get('/health', (_req, res) =>
    ApiResponse.success(res, {
        status: 'ok',
        service: serviceName,
        version: serviceVersion,
    })
)

const defaultRoutes = [
    { path: '/auth', route: authRouter },
    { path: '/public', route: publicRouter },
    { path: '/students', route: studentsRouter },
    { path: '/organizations', route: organizationsRouter },
    { path: '/campaigns', route: campaignsRouter },
    { path: '/approvals', route: approvalsRouter },
    { path: '/fundraising', route: fundraisingRouter },
    { path: '/item-donations', route: itemDonationsRouter },
    { path: '/events', route: eventsRouter },
    { path: '/certificates', route: certificatesRouter },
    { path: '/notifications', route: notificationsRouter },
    { path: '/reports', route: reportsRouter },
    { path: '/admin', route: adminRouter },
]

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route)
})

export default router
