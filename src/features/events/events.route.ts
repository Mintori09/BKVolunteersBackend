import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import * as eventsController from './events.controller'

const eventsRouter = Router()

eventsRouter.use(isAuth)

eventsRouter.get('/modules/:moduleId', eventsController.getEventModule)
eventsRouter.patch('/modules/:moduleId/config', eventsController.updateEventConfig)
eventsRouter.post(
    '/modules/:moduleId/registrations',
    eventsController.createEventRegistration
)
eventsRouter.get(
    '/modules/:moduleId/registrations',
    eventsController.listEventRegistrations
)
eventsRouter.patch(
    '/registrations/:registrationId/approve',
    eventsController.approveEventRegistration
)
eventsRouter.patch(
    '/registrations/:registrationId/reject',
    eventsController.rejectEventRegistration
)
eventsRouter.post(
    '/registrations/:registrationId/check-in',
    eventsController.checkInEventRegistration
)
eventsRouter.post(
    '/registrations/:registrationId/complete',
    eventsController.completeEventRegistration
)

export default eventsRouter
