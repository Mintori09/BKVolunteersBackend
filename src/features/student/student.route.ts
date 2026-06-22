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
    restrictTo('SINHVIEN'),
    studentController.getMe
)

studentRouter.patch(
    '/me/profile',
    isAuth,
    restrictTo('SINHVIEN'),
    validate(updateProfileSchema),
    studentController.updateMe
)

studentRouter.get(
    '/me/titles',
    isAuth,
    restrictTo('SINHVIEN'),
    studentController.getMyTitles
)

studentRouter.get(
    '/me/certificates',
    isAuth,
    restrictTo('SINHVIEN'),
    studentController.getMyCertificates
)

studentRouter.get(
    '/me/donations',
    isAuth,
    restrictTo('SINHVIEN'),
    studentController.getMyDonations
)

studentRouter.get(
    '/:id',
    isAuth,
    restrictTo('OPERATOR'),
    studentController.getStudentById
)

export default studentRouter
