import { Router } from 'express'
import { authRouter } from 'src/features/auth'
import { campaignRouter } from 'src/features/campaign'
import { passwordRouter } from 'src/features/forgotPassword'
import { managerWorkspaceRouter } from 'src/features/managerWorkspace'
import { mediaRouter } from 'src/features/media'
import { verifyEmailRouter } from 'src/features/verifyEmail'
import { authLimiter } from 'src/common/middleware'
import { config } from 'src/config'

const router = Router()

const defaultRoutes = [
    {
        path: '/auth',
        route: authRouter,
        limiter: config.node_env === 'production' ? authLimiter : undefined,
    },
    {
        path: '/password',
        route: passwordRouter,
    },
    {
        path: '/verify-email',
        route: verifyEmailRouter,
    },
    {
        path: '/media',
        route: mediaRouter,
    },
    {
        path: '/campaigns',
        route: campaignRouter,
    },
    {
        path: '/manager-workspace',
        route: managerWorkspaceRouter,
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
