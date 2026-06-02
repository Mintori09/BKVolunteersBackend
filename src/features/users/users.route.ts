import { Router } from 'express'
import validate from 'src/common/middleware/validate'
import isAuth from 'src/common/middleware/isAuth'
import { restrictTo } from 'src/common/middleware/restrictTo'
import * as usersController from './users.controller'
import {
    createUserSchema,
    listUsersSchema,
    updateUserSchema,
    updateUserStatusSchema,
    userIdParamsSchema,
} from './users.validation'

const usersRouter = Router()

usersRouter.use(isAuth, restrictTo('DOANTRUONG'))

usersRouter.get('/', validate(listUsersSchema), usersController.listUsers)
usersRouter.get('/options', usersController.getUserOptions)
usersRouter.post('/', validate(createUserSchema), usersController.createUser)
usersRouter.patch(
    '/:userId',
    validate(updateUserSchema),
    usersController.updateUser
)
usersRouter.patch(
    '/:userId/status',
    validate(updateUserStatusSchema),
    usersController.updateUserStatus
)
usersRouter.delete(
    '/:userId',
    validate(userIdParamsSchema),
    usersController.deleteUser
)

export default usersRouter
