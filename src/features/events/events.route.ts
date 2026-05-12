import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import validate from 'src/common/middleware/validate'
import * as eventsController from './events.controller'
import {
    eventApproveSchema,
    eventCheckInSchema,
    eventCompleteSchema,
    eventListRegistrationsSchema,
    eventModuleParamsSchema,
    eventRegisterSchema,
    eventRejectSchema,
} from './events.validation'
const eventsRouter = Router()

eventsRouter.get(
    '/modules/:moduleId',
    validate(eventModuleParamsSchema),
    eventsController.getEventModule
)

eventsRouter.post(
    '/modules/:moduleId/register',
    isAuth,
    validate(eventRegisterSchema),
    eventsController.registerEvent
)

eventsRouter.get(
    '/modules/:moduleId/registrations',
    isAuth,
    validate(eventListRegistrationsSchema),
    eventsController.listEventRegistrations
)

eventsRouter.patch(
    '/registrations/:id/approve',
    isAuth,
    validate(eventApproveSchema),
    eventsController.approveEventRegistration
)

eventsRouter.patch(
    '/registrations/:id/reject',
    isAuth,
    validate(eventRejectSchema),
    eventsController.rejectEventRegistration
)

eventsRouter.post(
    '/registrations/:id/check-in',
    isAuth,
    validate(eventCheckInSchema),
    eventsController.checkInEventRegistration
)

eventsRouter.post(
    '/registrations/:id/complete',
    isAuth,
    validate(eventCompleteSchema),
    eventsController.completeEventRegistration
)

export default eventsRouter
