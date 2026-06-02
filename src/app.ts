import express, { type Express, type Request, type Response } from 'express'
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

const app: Express = express()

const swaggerDocs = swaggerJsdoc(swaggerOptions)
const sepayWebhookPath = '/api/v1/fundraising/sepay/webhook'

const captureRawBody = (req: Request, _res: Response, buf: Buffer) => {
    const requestPath = req.originalUrl ?? req.url

    if (requestPath?.startsWith(sepayWebhookPath)) {
        req.rawBody = buf.toString('utf8')
    }
}

app.use(helmet(helmetConfig))
app.use(express.json({ verify: captureRawBody }))
app.use(express.urlencoded({ extended: true, verify: captureRawBody }))
app.use(xssMiddleware())
app.use(cookieParser())
app.use(cors(corsConfig))
app.use(compression({ filter: compressFilter }))

// Static files serving
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

app.use('/api/v1', router)

app.all('*path', (req, res, next) => {
    next(new ApiError(HttpStatus.NOT_FOUND, 'Route not found'))
})

app.use(errorHandler)

export default app
