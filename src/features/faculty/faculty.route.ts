import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import { restrictTo } from 'src/common/middleware'
import validate from 'src/common/middleware/validate'
import * as facultyController from './faculty.controller'
import {
    createFacultySchema,
    updateFacultySchema,
    getFacultiesSchema,
    facultyIdSchema,
    facultyCodeSchema,
} from './faculty.validation'

const facultyRouter = Router()

facultyRouter.post(
    '/',
    isAuth,
    restrictTo('DOANTRUONG'),
    validate(createFacultySchema),
    facultyController.createFaculty
)

facultyRouter.put(
    '/:id',
    isAuth,
    restrictTo('DOANTRUONG'),
    validate(updateFacultySchema),
    facultyController.updateFaculty
)

facultyRouter.delete(
    '/:id',
    isAuth,
    restrictTo('DOANTRUONG'),
    validate(facultyIdSchema),
    facultyController.deleteFaculty
)

facultyRouter.get(
    '/',
    isAuth,
    validate(getFacultiesSchema),
    facultyController.getAllFaculties
)

facultyRouter.get('/list', isAuth, facultyController.getFacultiesList)

facultyRouter.get(
    '/code/:code',
    isAuth,
    validate(facultyCodeSchema),
    facultyController.getFacultyByCode
)

facultyRouter.get(
    '/:id/statistics',
    isAuth,
    validate(facultyIdSchema),
    facultyController.getFacultyStats
)

facultyRouter.get(
    '/:id',
    isAuth,
    validate(facultyIdSchema),
    facultyController.getFacultyById
)

export default facultyRouter
