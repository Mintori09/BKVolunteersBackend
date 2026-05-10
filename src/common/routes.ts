import { Router } from 'express'
import { authRouter } from 'src/features/auth'
import { campaignRouter } from 'src/features/campaign'
import { studentRouter } from 'src/features/student'
import { notificationRouter } from 'src/features/notification'
import { authLimiter } from 'src/common/middleware'
import { config } from 'src/config'
import { publicRouter } from 'src/features/public'
import { organizationsRouter } from 'src/features/organizations'
import { approvalsRouter } from 'src/features/approvals'
import { fundraisingRouter } from 'src/features/fundraising'
import { certificatesRouter } from 'src/features/certificates'
import { reportsRouter } from 'src/features/reports'
import { adminRouter } from 'src/features/admin'
import { itemDonationsRouter } from 'src/features/item-donations'
import { eventsRouter } from 'src/features/events'

const router = Router()

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
]

defaultRoutes.forEach((route) => {
    if (route.limiter) {
        router.use(route.path, route.limiter, route.route)
    } else {
        router.use(route.path, route.route)
    }
})

export default router
