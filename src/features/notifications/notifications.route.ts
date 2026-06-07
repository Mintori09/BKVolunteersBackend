import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import * as notificationsController from './notifications.controller'

const notificationsRouter = Router()

notificationsRouter.use(isAuth)

notificationsRouter.get('/', notificationsController.getNotificationsPage)
notificationsRouter.patch(
    '/read-all',
    notificationsController.markAllNotificationsRead
)
notificationsRouter.patch(
    '/:id/read',
    notificationsController.markNotificationRead
)

export default notificationsRouter
