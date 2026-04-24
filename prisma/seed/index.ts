import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { seedFaculties } from './facultys.seed'
import { seedStudents } from './students.seed'

const adapter = new PrismaMariaDb(process.env['DATABASE_URL'] as string)
const prismaClient = new PrismaClient({ adapter })

try {
    await seedFaculties(prismaClient)
    await seedStudents(prismaClient)
} finally {
    await prismaClient.$disconnect()
}
