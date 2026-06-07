import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { seedFaculties } from './facultys.seed'
import { seedRuntimeData } from './runtime.seed'

const adapter = new PrismaMariaDb(process.env['DATABASE_URL'] as string)
const prismaClient = new PrismaClient({ adapter })

try {
    await seedFaculties(prismaClient)
    await seedRuntimeData(prismaClient)
} finally {
    await prismaClient.$disconnect()
}
