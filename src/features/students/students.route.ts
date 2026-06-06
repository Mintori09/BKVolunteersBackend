import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import * as studentsController from './students.controller'

const studentsRouter = Router()

studentsRouter.use(isAuth)

studentsRouter.get('/me/dashboard', studentsController.getDashboard)
studentsRouter.get('/me/activities', studentsController.getActivities)
studentsRouter.get('/me/donations', studentsController.getDonations)
studentsRouter.get('/me/certificates', studentsController.getMyCertificates)

export default studentsRouter
