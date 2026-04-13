import { PrismaClient } from '@prisma/client'
import config from './config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined
}

const adapter = new PrismaMariaDb(config.database_url)

const prismaClient = globalThis.prisma ?? new PrismaClient({ adapter })

if (config.node_env !== 'production') globalThis.prisma = prismaClient

export default prismaClient
