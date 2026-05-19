import app from './app'
import { config } from './config'
import { logger } from './common/middleware'

const server = app.listen(Number(config.server.port), () => {
    logger.log(
        'info',
        `Server is running on: http://localhost:${config.server.port}`
    )
})

const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed')
            process.exit(1)
        })
    } else {
        process.exit(1)
    }
}

const unexpectedErrorHandler = (error: unknown) => {
    logger.error(error)
    exitHandler()
}

process.on('uncaughtException', unexpectedErrorHandler)
process.on('unhandledRejection', unexpectedErrorHandler)

process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received.')
    logger.info('Closing server.')
    server.close((err) => {
        logger.info('Server closed.')
        process.exit(err ? 1 : 0)
    })
})
