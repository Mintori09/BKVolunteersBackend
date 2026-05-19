import { errorHandler } from './errorHandler'
import authLimiter from './authLimiter'
import logger from './logger'
import isAuth from './isAuth'
import { xssMiddleware } from './xssMiddleware'
import validate from './validate'
import { restrictTo } from './restrictTo'
import isCreator from './isCreator'
import isStudent from './isStudent'

export {
    errorHandler,
    authLimiter,
    logger,
    isAuth,
    xssMiddleware,
    validate,
    restrictTo,
    isCreator,
    isStudent,
}
