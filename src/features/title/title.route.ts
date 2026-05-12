import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import { restrictTo } from 'src/common/middleware'
import validate from 'src/common/middleware/validate'
import * as titleController from './title.controller'
import {
    createTitleSchema,
    updateTitleSchema,
    getTitlesSchema,
    titleIdSchema,
} from './title.validation'

const titleRouter = Router()

titleRouter.post(
    '/',
    isAuth,
    restrictTo('SCHOOL_ADMIN', 'SCHOOL_REVIEWER'),
    validate(createTitleSchema),
    titleController.createTitle
)

titleRouter.put(
    '/:id',
    isAuth,
    restrictTo('SCHOOL_ADMIN', 'SCHOOL_REVIEWER'),
    validate(updateTitleSchema),
    titleController.updateTitle
)

titleRouter.delete(
    '/:id',
    isAuth,
    restrictTo('SCHOOL_ADMIN', 'SCHOOL_REVIEWER'),
    validate(titleIdSchema),
    titleController.deleteTitle
)

titleRouter.get(
    '/',
    isAuth,
    validate(getTitlesSchema),
    titleController.getAllTitles
)

titleRouter.get(
    '/:id',
    isAuth,
    validate(titleIdSchema),
    titleController.getTitleById
)

export default titleRouter
