import { Router } from 'express'
import { authRouter } from 'src/features/auth'
import { passwordRouter } from 'src/features/forgotPassword'
import { facultyRouter } from 'src/features/faculty'
import { campaignRouter } from 'src/features/campaign'
import { uploadRouter, filesRouter } from 'src/features/upload'
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
        path: '/faculties',
        route: facultyRouter,
    },
    {
        path: '/campaigns',
        route: campaignRouter,
    },
    {
        path: '/upload',
        route: uploadRouter,
    },
    {
        path: '/files',
        route: filesRouter,
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
