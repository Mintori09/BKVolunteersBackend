import { Router } from 'express'
import isAuth from 'src/common/middleware/isAuth'
import { storageUploadMiddleware } from './storage.middleware'
import * as storageController from './storage.controller'

const storageRouter = Router()

storageRouter.use(isAuth)

storageRouter.post(
    '/upload',
    storageUploadMiddleware.single('file'),
    storageController.uploadStorageFile
)
storageRouter.get(
    '/files/:id/access-url',
    storageController.getStorageFileAccessUrl
)

export default storageRouter
