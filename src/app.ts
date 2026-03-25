import express, { type Express } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { xssMiddleware } from 'src/common/middleware/xssMiddleware'
import { corsConfig, helmetConfig } from 'src/config'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import compressFilter from 'src/utils/compressFilter.util'
import { errorHandler } from 'src/common/middleware'
import { HttpStatus } from './common/constants'
import router from 'src/common/routes'
import { ApiError } from 'src/utils/ApiError'
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { swaggerOptions } from 'src/config/swagger'

const app: Express = express()

const swaggerDocs = swaggerJsdoc(swaggerOptions)

app.use(helmet(helmetConfig))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(xssMiddleware())
app.use(cookieParser())
app.use(cors(corsConfig))
app.use(compression({ filter: compressFilter }))

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

app.use('/api/v1', router)

app.all('*path', (req, res, next) => {
    next(new ApiError(HttpStatus.NOT_FOUND, 'Route not found'))
})

app.use(errorHandler)

export default app
