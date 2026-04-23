import { Router } from 'express'
import { isAuth, restrictTo } from 'src/common/middleware'
import * as statisticsController from './statistics.controller'

const statisticsRouter = Router()

/**
 * @openapi
 * tags:
 *   name: Statistics
 *   description: Platform statistics
 */

/**
 * @openapi
 * /statistics/system:
 *   get:
 *     summary: Get system statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
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
 *                       $ref: '#/components/schemas/SystemStatisticsOutput'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

statisticsRouter.get(
    '/system',
    isAuth,
    restrictTo('DOANTRUONG'),
    statisticsController.getSystemStatistics
)

export default statisticsRouter
