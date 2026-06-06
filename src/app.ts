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
import path from 'path'
import { listLocations as listLocationsAlias } from 'src/features/locations/locations.controller'

const app: Express = express()

const swaggerDocs = swaggerJsdoc(swaggerOptions)

const healthResponse = () => ({
    success: true,
    message: 'Backend is healthy',
    data: {
        service: 'BKVolunteersBackend',
        status: 'ok',
        routes: [
            '/api/v1/auth',
            '/api/v1/users',
            '/api/v1/campaigns',
            '/api/v1/public/campaigns',
            '/api/v1/organizations',
            '/api/v1/reports',
            '/api/v1/notifications',
            '/api/v1/students',
            '/api/v1/certificates',
            '/api/v1/events',
            '/api/v1/fundraising',
            '/api/v1/approvals',
            '/api/v1/locations',
        ],
        timestamp: new Date().toISOString(),
    },
})

app.use(helmet(helmetConfig))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(xssMiddleware())
app.use(cookieParser())
app.use(cors(corsConfig))
app.use(compression({ filter: compressFilter }))

// Static files serving
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

app.get('/health', (_req, res) => {
    res.status(HttpStatus.OK).json(healthResponse())
})

app.get('/api/health', (_req, res) => {
    res.status(HttpStatus.OK).json(healthResponse())
})

app.get('/api/v1/health', (_req, res) => {
    res.status(HttpStatus.OK).json(healthResponse())
})

app.get('/api/locations', listLocationsAlias)
app.use('/api/v1', router)

app.all('*path', (req, res, next) => {
    next(new ApiError(HttpStatus.NOT_FOUND, 'Route not found'))
})

app.use(errorHandler)

export default app
