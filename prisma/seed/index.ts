import { prismaClient } from '../../src/config'
import { seedFaculties } from './facultys.seed'
import { seedStudents } from './students.seed'

await seedFaculties(prismaClient)
await seedStudents(prismaClient)
