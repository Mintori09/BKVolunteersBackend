import { PrismaClient } from '@prisma/client'
import config from './config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

declare global {
    var prisma: PrismaClient | undefined
}

const adapter = new PrismaMariaDb(process.env.DATABASE_URL as string)

const prismaClient: PrismaClient = new PrismaClient({ adapter })

if (config.node_env !== 'production') globalThis.prisma = prismaClient

export default prismaClient
