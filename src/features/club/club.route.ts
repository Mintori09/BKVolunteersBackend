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

clubRouter.post(
    '/',
    isAuth,
    restrictTo('DOANTRUONG'),
    validate(createClubSchema),
    clubController.createClub
)

clubRouter.put(
    '/:id',
    isAuth,
    restrictTo('DOANTRUONG'),
    validate(updateClubSchema),
    clubController.updateClub
)

clubRouter.delete(
    '/:id',
    isAuth,
    restrictTo('DOANTRUONG'),
    validate(clubIdSchema),
    clubController.deleteClub
)

clubRouter.get(
    '/',
    isAuth,
    validate(getClubsSchema),
    clubController.getAllClubs
)

clubRouter.get(
    '/:id',
    isAuth,
    validate(clubIdSchema),
    clubController.getClubById
)

export default clubRouter
