import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import { restrictTo } from 'src/common/middleware'
import validate from 'src/common/middleware/validate'
import * as studentController from './student.controller'
import { updateProfileSchema } from './student.validation'

const studentRouter = Router()

studentRouter.get(
    '/me/dashboard',
    isAuth,
    restrictTo('STUDENT'),
    studentController.getMe
)

studentRouter.patch(
    '/me/profile',
    isAuth,
    restrictTo('STUDENT'),
    validate(updateProfileSchema),
    studentController.updateMe
)

studentRouter.get(
    '/me/titles',
    isAuth,
    restrictTo('STUDENT'),
    studentController.getMyTitles
)

studentRouter.get(
    '/me/certificates',
    isAuth,
    restrictTo('STUDENT'),
    studentController.getMyCertificates
)

studentRouter.get(
    '/me/donations',
    isAuth,
    restrictTo('STUDENT'),
    studentController.getMyDonations
)

studentRouter.get(
    '/:id',
    isAuth,
    restrictTo('OPERATOR'),
    studentController.getStudentById
)

export default studentRouter
