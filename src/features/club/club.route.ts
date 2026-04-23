import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import { restrictTo } from 'src/common/middleware'
import validate from 'src/common/middleware/validate'
import * as clubController from './club.controller'
import {
    createClubSchema,
    updateClubSchema,
    getClubsSchema,
    clubIdSchema,
} from './club.validation'

const clubRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Club
 *   description: Club management
 */

/**
 * @openapi
 * /clubs:
 *   post:
 *     summary: Create club
 *     tags: [Club]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               facultyId:
 *                 type: integer
 *               leaderId:
 *                 type: string
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
 *                       $ref: '#/components/schemas/ClubDetail'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */

clubRouter.post(
    '/',
    isAuth,
    restrictTo('DOANTRUONG'),
    validate(createClubSchema),
    clubController.createClub
)

/**
 * @openapi
 * /clubs/{id}:
 *   put:
 *     summary: Update club
 *     tags: [Club]
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
 *               name:
 *                 type: string
 *               facultyId:
 *                 type: integer
 *               leaderId:
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
 *                       $ref: '#/components/schemas/ClubDetail'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */

clubRouter.put(
    '/:id',
    isAuth,
    restrictTo('DOANTRUONG'),
    validate(updateClubSchema),
    clubController.updateClub
)

/**
 * @openapi
 * /clubs/{id}:
 *   delete:
 *     summary: Delete club
 *     tags: [Club]
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
 *                       nullable: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */

clubRouter.delete(
    '/:id',
    isAuth,
    restrictTo('DOANTRUONG'),
    validate(clubIdSchema),
    clubController.deleteClub
)

/**
 * @openapi
 * /clubs:
 *   get:
 *     summary: List clubs
 *     tags: [Club]
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
 *         name: facultyId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
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
 *                       $ref: '#/components/schemas/ClubListOutput'
 *       401:
 *         description: Unauthorized
 */

clubRouter.get(
    '/',
    isAuth,
    validate(getClubsSchema),
    clubController.getAllClubs
)

/**
 * @openapi
 * /clubs/{id}:
 *   get:
 *     summary: Get club by ID
 *     tags: [Club]
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
 *                       $ref: '#/components/schemas/ClubDetail'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not Found
 */

clubRouter.get(
    '/:id',
    isAuth,
    validate(clubIdSchema),
    clubController.getClubById
)

export default clubRouter
