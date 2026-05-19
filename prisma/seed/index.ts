import { prismaClient } from '../../src/config'
import { seedFaculties } from './facultys.seed'
import { seedTitles } from './titles.seed'
import { seedOrganizations } from './organizations.seed'
import { seedOperators } from './operators.seed'
import { seedStudents } from './students.seed'
import { seedCampaigns } from './campaigns.seed'

await seedFaculties(prismaClient)
await seedTitles(prismaClient)
await seedOrganizations(prismaClient)
await seedOperators(prismaClient)
await seedStudents(prismaClient)
await seedCampaigns(prismaClient)
