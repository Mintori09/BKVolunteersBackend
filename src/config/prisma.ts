import { PrismaClient } from '@prisma/client'
import config from './config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

declare global {
    var prisma: PrismaClient | undefined
}

type MariaDbPoolConfig = Exclude<
    ConstructorParameters<typeof PrismaMariaDb>[0],
    string
>

const createMariaDbPoolConfig = (url: string): MariaDbPoolConfig => {
    const parsedUrl = new URL(url)

    return {
        host: parsedUrl.hostname,
        port: Number(parsedUrl.port || 3306),
        user: decodeURIComponent(parsedUrl.username),
        password: decodeURIComponent(parsedUrl.password),
        database: parsedUrl.pathname.replace(/^\//, ''),
        connectionLimit: 10,
        acquireTimeout: 10000,
        allowPublicKeyRetrieval: true,
    } as MariaDbPoolConfig
}

const adapter = new PrismaMariaDb(
    createMariaDbPoolConfig(config.database_url)
)

const prismaClient: PrismaClient = new PrismaClient({ adapter })

if (config.node_env !== 'production') globalThis.prisma = prismaClient

export default prismaClient
