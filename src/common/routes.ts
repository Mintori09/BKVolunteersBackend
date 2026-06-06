import { Router } from 'express'
import { authLimiter } from 'src/common/middleware'
import { approvalsRouter } from 'src/features/approvals'
import { authRouter } from 'src/features/auth'
import { campaignsRouter } from 'src/features/campaigns'
import { certificatesRouter } from 'src/features/certificates'
import { eventsRouter } from 'src/features/events'
import { fundraisingRouter } from 'src/features/fundraising'
import { locationsRouter } from 'src/features/locations'
import { notificationsRouter } from 'src/features/notifications'
import { organizationsRouter } from 'src/features/organizations'
import adminOrganizationsRouter from 'src/features/organizations/organizations.admin.route'
import { publicRouter } from 'src/features/public'
import { reportsRouter } from 'src/features/reports'
import { studentsRouter } from 'src/features/students'
import { storageRouter } from 'src/features/storage'
import { usersRouter } from 'src/features/users'
import { config } from 'src/config'

const router = Router()

const defaultRoutes = [
    {
        path: '/auth',
        route: authRouter,
        limiter: config.node_env === 'production' ? authLimiter : undefined,
    },
    {
        path: '/users',
        route: usersRouter,
    },
    {
        path: '/campaigns',
        route: campaignsRouter,
    },
    {
        path: '/organizations',
        route: organizationsRouter,
    },
    {
        path: '/admin/organizations',
        route: adminOrganizationsRouter,
    },
    {
        path: '/public',
        route: publicRouter,
    },
    {
        path: '/reports',
        route: reportsRouter,
    },
    {
        path: '/notifications',
        route: notificationsRouter,
    },
    {
        path: '/students',
        route: studentsRouter,
    },
    {
        path: '/certificates',
        route: certificatesRouter,
    },
    {
        path: '/events',
        route: eventsRouter,
    },
    {
        path: '/fundraising',
        route: fundraisingRouter,
    },
    {
        path: '/approvals',
        route: approvalsRouter,
    },
    {
        path: '/locations',
        route: locationsRouter,
    },
    {
        path: '/storage',
        route: storageRouter,
    },
]

defaultRoutes.forEach((route) => {
    if (route.limiter) {
        router.use(route.path, route.limiter, route.route)
    } else {
        router.use(route.path, route.route)
    }
})

export default router
