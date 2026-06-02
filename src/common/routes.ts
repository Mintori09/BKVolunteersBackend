import { Router } from 'express'
import { ApiResponse } from 'src/utils/ApiResponse'
import { authRouter } from 'src/features/auth'
import { adminRouter } from 'src/features/admin'
import { approvalsRouter } from 'src/features/approvals'
import { campaignRouter } from 'src/features/campaign'
import { certificatesRouter } from 'src/features/certificates'
import { authLimiter } from 'src/common/middleware'
import { config } from 'src/config'
import { eventsRouter } from 'src/features/events'
import { fundraisingRouter } from 'src/features/fundraising'
import { itemDonationsRouter } from 'src/features/item-donations'
import { notificationRouter } from 'src/features/notification'
import { organizationsRouter } from 'src/features/organizations'
import { passwordRouter } from 'src/features/password'
import { publicRouter } from 'src/features/public'
import { reportsRouter } from 'src/features/reports'
import { studentRouter } from 'src/features/student'
import { titleRouter } from 'src/features/title'
import { filesRouter, uploadRouter } from 'src/features/upload'

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
    {
        path: '/auth',
        route: authRouter,
        limiter: config.node_env === 'production' ? authLimiter : undefined,
    },
    { path: '/public', route: publicRouter },
    { path: '/organizations', route: organizationsRouter },
    {
        path: '/campaigns',
        route: campaignRouter,
    },
    { path: '/approvals', route: approvalsRouter },
    { path: '/fundraising', route: fundraisingRouter },
    { path: '/item-donations', route: itemDonationsRouter },
    { path: '/events', route: eventsRouter },
    {
        path: '/students',
        route: studentRouter,
    },
    { path: '/certificates', route: certificatesRouter },
    {
        path: '/notifications',
        route: notificationRouter,
    },
    { path: '/reports', route: reportsRouter },
    { path: '/admin', route: adminRouter },
    { path: '/password', route: passwordRouter },
    { path: '/upload', route: uploadRouter },
    { path: '/files', route: filesRouter },
    { path: '/titles', route: titleRouter },
]

defaultRoutes.forEach((route) => {
    if (route.limiter) {
        router.use(route.path, route.limiter, route.route)
    } else {
        router.use(route.path, route.route)
    }
})

export default router
