import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import { restrictTo } from 'src/common/middleware'
import validate from 'src/common/middleware/validate'
import * as studentController from './student.controller'
import { pointsHistorySchema, updateProfileSchema } from './student.validation'

const studentRouter = Router()

studentRouter.get(
    '/me',
    isAuth,
    restrictTo('SINHVIEN'),
    studentController.getMe
)

studentRouter.put(
    '/me',
    isAuth,
    restrictTo('SINHVIEN'),
    validate(updateProfileSchema),
    studentController.updateMe
)

studentRouter.get(
    '/me/points',
    isAuth,
    restrictTo('SINHVIEN'),
    validate(pointsHistorySchema),
    studentController.getPointsHistory
)

studentRouter.get(
    '/me/titles',
    isAuth,
    restrictTo('SINHVIEN'),
    studentController.getMyTitles
)

studentRouter.get(
    '/:id',
    isAuth,
    restrictTo('CLB', 'LCD', 'DOANTRUONG'),
    studentController.getStudentById
)

export default studentRouter
