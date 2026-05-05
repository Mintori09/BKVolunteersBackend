import prismaClient from '../../src/config/prisma'
import { seedFaculties } from './facultys.seed'
import { seedStudents } from './students.seed'
import { seedContractFixtures } from './contract.seed'

try {
    await seedFaculties(prismaClient)
    await seedStudents(prismaClient)
    await seedContractFixtures(prismaClient)
} finally {
    await prismaClient.$disconnect()
}
