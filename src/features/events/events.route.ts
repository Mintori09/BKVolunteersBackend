import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import isStudent from 'src/common/middleware/isStudent'
import { restrictTo } from 'src/common/middleware/restrictTo'
import * as eventsController from './events.controller'

const eventsRouter = Router()

eventsRouter.use(isAuth)

eventsRouter.get('/modules/:moduleId', eventsController.getEventModule)
eventsRouter.patch(
    '/modules/:moduleId/config',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    eventsController.updateEventConfig
)
eventsRouter.post(
    '/modules/:moduleId/registrations',
    isStudent,
    eventsController.createEventRegistration
)
eventsRouter.get(
    '/modules/:moduleId/registrations',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    eventsController.listEventRegistrations
)
eventsRouter.patch(
    '/registrations/:registrationId/approve',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    eventsController.approveEventRegistration
)
eventsRouter.patch(
    '/registrations/:registrationId/reject',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    eventsController.rejectEventRegistration
)
eventsRouter.post(
    '/registrations/:registrationId/check-in',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    eventsController.checkInEventRegistration
)
eventsRouter.post(
    '/registrations/:registrationId/complete',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    eventsController.completeEventRegistration
)

export default eventsRouter
