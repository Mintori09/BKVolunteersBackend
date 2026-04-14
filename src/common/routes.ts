import { Router } from 'express'
import { authRouter } from 'src/features/auth'
import { passwordRouter } from 'src/features/forgotPassword'
import { itemPhaseRouter } from 'src/features/item-phase'
import { itemDonationRouter } from 'src/features/item-donation'
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
]

const itemPhaseRoutes = [
    {
        path: '/campaigns/:campaignId/item-phases',
        route: itemPhaseRouter,
    },
]

const itemDonationRoutes = [
    {
        path: '/donations',
        route: itemDonationRouter,
    },
    {
        path: '/item-phases',
        route: itemDonationRouter,
    },
]

defaultRoutes.forEach((route) => {
    if (route.limiter) {
        router.use(route.path, route.limiter, route.route)
    } else {
        router.use(route.path, route.route)
    }
})

itemPhaseRoutes.forEach((route) => {
    router.use(route.path, route.route)
})

itemDonationRoutes.forEach((route) => {
    router.use(route.path, route.route)
})

export default router
