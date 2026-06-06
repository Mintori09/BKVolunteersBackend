import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import * as fundraisingController from './fundraising.controller'

const fundraisingRouter = Router()

fundraisingRouter.use(isAuth)

fundraisingRouter.get('/modules/:moduleId', fundraisingController.getFundraisingModule)
fundraisingRouter.patch(
    '/modules/:moduleId/config',
    fundraisingController.updateFundraisingConfig
)
fundraisingRouter.post(
    '/modules/:moduleId/donations',
    fundraisingController.createMoneyDonation
)
fundraisingRouter.get(
    '/modules/:moduleId/donations',
    fundraisingController.listFundraisingDonations
)
fundraisingRouter.get('/donations/:donationId', fundraisingController.getDonationById)
fundraisingRouter.patch(
    '/donations/:donationId/verify',
    fundraisingController.verifyFundraisingDonation
)
fundraisingRouter.patch(
    '/donations/:donationId/reject',
    fundraisingController.rejectFundraisingDonation
)
fundraisingRouter.get(
    '/transactions',
    fundraisingController.listFundraisingTransactions
)
fundraisingRouter.patch(
    '/transactions/:transactionId/attach-donation',
    fundraisingController.attachFundraisingTransaction
)
fundraisingRouter.patch(
    '/transactions/:transactionId/unmatch',
    fundraisingController.unmatchFundraisingTransaction
)

export default fundraisingRouter
