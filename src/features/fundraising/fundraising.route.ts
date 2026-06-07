import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import isStudent from 'src/common/middleware/isStudent'
import { restrictTo } from 'src/common/middleware/restrictTo'
import * as fundraisingController from './fundraising.controller'

const fundraisingRouter = Router()

fundraisingRouter.use(isAuth)

fundraisingRouter.get(
    '/modules/:moduleId',
    fundraisingController.getFundraisingModule
)
fundraisingRouter.patch(
    '/modules/:moduleId/config',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    fundraisingController.updateFundraisingConfig
)
fundraisingRouter.post(
    '/modules/:moduleId/donations',
    isStudent,
    fundraisingController.createMoneyDonation
)
fundraisingRouter.get(
    '/modules/:moduleId/donations',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    fundraisingController.listFundraisingDonations
)
fundraisingRouter.get(
    '/donations/:donationId',
    fundraisingController.getDonationById
)
fundraisingRouter.patch(
    '/donations/:donationId/verify',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    fundraisingController.verifyFundraisingDonation
)
fundraisingRouter.patch(
    '/donations/:donationId/reject',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    fundraisingController.rejectFundraisingDonation
)
fundraisingRouter.get(
    '/transactions',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    fundraisingController.listFundraisingTransactions
)
fundraisingRouter.patch(
    '/transactions/:transactionId/attach-donation',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    fundraisingController.attachFundraisingTransaction
)
fundraisingRouter.patch(
    '/transactions/:transactionId/unmatch',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    fundraisingController.unmatchFundraisingTransaction
)

export default fundraisingRouter
