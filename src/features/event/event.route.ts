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

/**
 * @openapi
 * tags:
 *   name: Event
 *   description: Event management and participation
 */

eventRouter.use(isAuth)

/**
 * @openapi
 * /campaigns/{campaignId}/events:
 *   post:
 *     summary: Create an event for a campaign
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *               - maxParticipants
 *               - registrationStart
 *               - registrationEnd
 *               - eventStart
 *               - eventEnd
 *             properties:
 *               location:
 *                 type: string
 *               maxParticipants:
 *                 type: integer
 *               registrationStart:
 *                 type: string
 *                 format: date-time
 *               registrationEnd:
 *                 type: string
 *                 format: date-time
 *               eventStart:
 *                 type: string
 *                 format: date-time
 *               eventEnd:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/EventOutput'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
eventRouter.post(
    '/campaigns/:campaignId/events',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(createEventSchema),
    eventController.createEvent
)

/**
 * @openapi
 * /campaigns/{campaignId}/events/{eventId}:
 *   put:
 *     summary: Update an event
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location:
 *                 type: string
 *               maxParticipants:
 *                 type: integer
 *               registrationStart:
 *                 type: string
 *                 format: date-time
 *               registrationEnd:
 *                 type: string
 *                 format: date-time
 *               eventStart:
 *                 type: string
 *                 format: date-time
 *               eventEnd:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/EventOutput'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
eventRouter.put(
    '/campaigns/:campaignId/events/:eventId',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(updateEventSchema),
    eventController.updateEvent
)

/**
 * @openapi
 * /campaigns/{campaignId}/events/{eventId}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: No Content
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
eventRouter.delete(
    '/campaigns/:campaignId/events/:eventId',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(deleteEventSchema),
    eventController.deleteEvent
)

/**
 * @openapi
 * /campaigns/{campaignId}/events:
 *   get:
 *     summary: List events of a campaign
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/EventListOutput'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found
 */
eventRouter.get(
    '/campaigns/:campaignId/events',
    validate(getEventsByCampaignSchema),
    eventController.getEventsByCampaign
)

/**
 * @openapi
 * /events/{eventId}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/EventDetailOutput'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found
 */
eventRouter.get(
    '/events/:eventId',
    validate(getEventByIdSchema),
    eventController.getEventById
)

/**
 * @openapi
 * /events/{eventId}/register:
 *   post:
 *     summary: Register for an event
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ParticipantOutput'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 *       409:
 *         description: Conflict
 */
eventRouter.post(
    '/events/:eventId/register',
    restrictTo('SINHVIEN'),
    validate(registerEventSchema),
    eventController.registerForEvent
)

/**
 * @openapi
 * /events/{eventId}/register:
 *   delete:
 *     summary: Cancel event registration
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ParticipantOutput'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
eventRouter.delete(
    '/events/:eventId/register',
    restrictTo('SINHVIEN'),
    validate(cancelRegistrationSchema),
    eventController.cancelRegistration
)

/**
 * @openapi
 * /participants/me:
 *   get:
 *     summary: List my event participations
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ParticipantListOutput'
 *       401:
 *         description: Unauthorized
 */
eventRouter.get(
    '/participants/me',
    restrictTo('SINHVIEN'),
    validate(getMyParticipantsSchema),
    eventController.getMyParticipants
)

/**
 * @openapi
 * /events/{eventId}/participants:
 *   get:
 *     summary: List event participants
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: isCheckedIn
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ParticipantListOutput'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found
 */
eventRouter.get(
    '/events/:eventId/participants',
    validate(getParticipantsByEventSchema),
    eventController.getParticipantsByEvent
)

/**
 * @openapi
 * /participants/{id}/approve:
 *   post:
 *     summary: Approve a participant
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ParticipantWithStudentOutput'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
eventRouter.post(
    '/participants/:id/approve',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(approveParticipantSchema),
    eventController.approveParticipant
)

/**
 * @openapi
 * /participants/{id}/reject:
 *   post:
 *     summary: Reject a participant
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ParticipantWithStudentOutput'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
eventRouter.post(
    '/participants/:id/reject',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(rejectParticipantSchema),
    eventController.rejectParticipant
)

/**
 * @openapi
 * /participants/{id}/check-in:
 *   post:
 *     summary: Check in a participant
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ParticipantWithStudentOutput'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
eventRouter.post(
    '/participants/:id/check-in',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(checkInParticipantSchema),
    eventController.checkInParticipant
)

/**
 * @openapi
 * /participants/{id}/certificate:
 *   post:
 *     summary: Send a certificate to one participant
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - certificateUrl
 *             properties:
 *               certificateUrl:
 *                 type: string
 *                 format: uri
 *               points:
 *                 type: integer
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponseSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ParticipantWithStudentOutput'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
eventRouter.post(
    '/participants/:id/certificate',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(sendCertificateSchema),
    eventController.sendCertificate
)

/**
 * @openapi
 * /events/{eventId}/certificates:
 *   post:
 *     summary: Send certificates in bulk
 *     tags: [Event]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pointsPerParticipant:
 *                 type: integer
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
eventRouter.post(
    '/events/:eventId/certificates',
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    validate(bulkCertificateSchema),
    eventController.sendBulkCertificates
)

export default eventRouter
