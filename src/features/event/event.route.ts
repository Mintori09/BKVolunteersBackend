import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import { restrictTo } from 'src/common/middleware/restrictTo'
import validate from 'src/common/middleware/validate'
import * as eventController from './event.controller'
import {
    createEventSchema,
    updateEventSchema,
    deleteEventSchema,
    getEventsByCampaignSchema,
    getEventByIdSchema,
    registerEventSchema,
    cancelRegistrationSchema,
    getMyParticipantsSchema,
    getParticipantsByEventSchema,
    approveParticipantSchema,
    rejectParticipantSchema,
    checkInParticipantSchema,
    sendCertificateSchema,
    bulkCertificateSchema,
} from './event.validation'

const eventRouter = Router()

eventRouter.use(isAuth)

eventRouter.post(
    '/campaigns/:campaignId/events',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(createEventSchema),
    eventController.createEvent
)

eventRouter.put(
    '/campaigns/:campaignId/events/:eventId',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(updateEventSchema),
    eventController.updateEvent
)

eventRouter.delete(
    '/campaigns/:campaignId/events/:eventId',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(deleteEventSchema),
    eventController.deleteEvent
)

eventRouter.get(
    '/campaigns/:campaignId/events',
    validate(getEventsByCampaignSchema),
    eventController.getEventsByCampaign
)

eventRouter.get(
    '/events/:eventId',
    validate(getEventByIdSchema),
    eventController.getEventById
)

eventRouter.post(
    '/events/:eventId/register',
    restrictTo('SINHVIEN'),
    validate(registerEventSchema),
    eventController.registerForEvent
)

eventRouter.delete(
    '/events/:eventId/register',
    restrictTo('SINHVIEN'),
    validate(cancelRegistrationSchema),
    eventController.cancelRegistration
)

eventRouter.get(
    '/participants/me',
    restrictTo('SINHVIEN'),
    validate(getMyParticipantsSchema),
    eventController.getMyParticipants
)

eventRouter.get(
    '/events/:eventId/participants',
    validate(getParticipantsByEventSchema),
    eventController.getParticipantsByEvent
)

eventRouter.post(
    '/participants/:id/approve',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(approveParticipantSchema),
    eventController.approveParticipant
)

eventRouter.post(
    '/participants/:id/reject',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(rejectParticipantSchema),
    eventController.rejectParticipant
)

eventRouter.post(
    '/participants/:id/check-in',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(checkInParticipantSchema),
    eventController.checkInParticipant
)

eventRouter.post(
    '/participants/:id/certificate',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(sendCertificateSchema),
    eventController.sendCertificate
)

eventRouter.post(
    '/events/:eventId/certificates',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(bulkCertificateSchema),
    eventController.sendBulkCertificates
)

export default eventRouter
