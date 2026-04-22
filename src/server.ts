import app from './app'
import { config, prismaClient } from './config'
import { logger } from './common/middleware'

const DB_CONNECT_RETRY_LIMIT = 10
const DB_CONNECT_RETRY_DELAY_MS = 3000

let server: ReturnType<typeof app.listen> | undefined

const sleep = (ms: number) =>
    new Promise((resolve) => {
        setTimeout(resolve, ms)
    })

const connectDatabaseWithRetry = async () => {
    for (let attempt = 1; attempt <= DB_CONNECT_RETRY_LIMIT; attempt += 1) {
        try {
            await prismaClient.$connect()
            logger.info(
                `Database connected successfully (${attempt}/${DB_CONNECT_RETRY_LIMIT})`
            )
            return
        } catch (error) {
            logger.error(error)

            if (attempt === DB_CONNECT_RETRY_LIMIT) {
                throw error
            }

            logger.warn(
                `Database is not ready yet (${attempt}/${DB_CONNECT_RETRY_LIMIT}). Retrying in ${DB_CONNECT_RETRY_DELAY_MS / 1000}s...`
            )
            await sleep(DB_CONNECT_RETRY_DELAY_MS)
        }
    }
}

const startServer = async () => {
    await connectDatabaseWithRetry()

    server = app.listen(Number(config.server.port), () => {
        logger.log(
            'info',
            `Server is running on: http://localhost:${config.server.port}`
        )
    })
}

const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed')
            prismaClient
                .$disconnect()
                .catch((error) => logger.error(error))
                .finally(() => process.exit(1))
        })
    } else {
        prismaClient
            .$disconnect()
            .catch((error) => logger.error(error))
            .finally(() => process.exit(1))
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
    if (!server) {
        prismaClient
            .$disconnect()
            .catch((error) => logger.error(error))
            .finally(() => process.exit(0))
        return
    }

    server.close((err) => {
        logger.info('Server closed.')
        prismaClient
            .$disconnect()
            .catch((error) => logger.error(error))
            .finally(() => process.exit(err ? 1 : 0))
    })
})

void startServer().catch(unexpectedErrorHandler)
