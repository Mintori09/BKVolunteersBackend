import { Router } from 'express'
import { authRouter } from 'src/features/auth'
import { passwordRouter } from 'src/features/forgotPassword'
import { campaignRouter } from 'src/features/campaign'
import moneyDonationRouter, { phaseDonationsRouter } from 'src/features/money-donation/money-donation.route'
import donationRouter from 'src/features/donation/donation.route'
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
        path: '/campaigns',
        route: campaignRouter,
    },
    {
        path: '/campaigns/:campaignId/money-phases',
        route: moneyDonationRouter,
    },
    {
        path: '/money-phases',
        route: phaseDonationsRouter,
    },
    {
        path: '/donations',
        route: donationRouter,
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
