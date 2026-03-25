import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import * as argon2 from 'argon2'

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined
}

const adapter = new PrismaMariaDb(process.env.DATABASE_URL as string)

const prisma: PrismaClient = new PrismaClient({ adapter })

async function main() {
    console.log('Seeding database...')

    // Cleanup data
    await prisma.refreshToken.deleteMany()
    await prisma.resetToken.deleteMany()
    await prisma.emailVerificationToken.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()

    const hashedPassword = await argon2.hash('password123')

    const users = [
        {
            firstName: 'Admin',
            lastName: 'User',
            name: 'Admin User',
            email: 'admin@dut.udn.vn',
            password: hashedPassword,
            emailVerified: new Date(),
            role: 'ADMIN',
        },
        {
            firstName: 'John',
            lastName: 'Doe',
            name: 'John Doe',
            email: 'john@dut.udn.vn',
            password: hashedPassword,
            emailVerified: new Date(),
            role: 'USER',
        },
    ]

    for (const user of users) {
        await prisma.user.create({ data: user })
    }

    console.log('Database seeded successfully!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
