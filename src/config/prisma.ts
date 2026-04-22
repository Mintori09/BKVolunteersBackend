import { PrismaClient } from '@prisma/client'
import config from './config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import type { PoolConfig, SqlError } from 'mariadb'

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined
}

const databaseUrl = new URL(config.database_url)
const databaseName = databaseUrl.pathname.replace(/^\//, '')

const mariadbPoolConfig: PoolConfig = {
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseName,
    connectionLimit: 10,
    connectTimeout: 20_000,
    acquireTimeout: 20_000,
    socketTimeout: 20_000,
}

const adapter = new PrismaMariaDb(mariadbPoolConfig, {
    database: databaseName,
    useTextProtocol: true,
    onConnectionError: (error: SqlError) => {
        console.error(
            `[prisma-mariadb] ${error.code ?? 'connection_error'}: ${error.message}`
        )
    },
})

const prismaClient = globalThis.prisma ?? new PrismaClient({ adapter })

if (config.node_env !== 'production') globalThis.prisma = prismaClient

export default prismaClient
