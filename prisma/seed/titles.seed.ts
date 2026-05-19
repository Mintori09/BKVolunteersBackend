import { PrismaClient } from '@prisma/client'

const TITLES = [
    { name: 'Tân binh', description: 'Danh hiệu khởi đầu', minPoints: 0 },
    { name: 'Tình nguyện viên', description: 'Đã tham gia hoạt động', minPoints: 50 },
    { name: 'Nòng cốt', description: 'Đóng góp nổi bật', minPoints: 150 },
]

export const seedTitles = async (prisma: PrismaClient) => {
    for (const title of TITLES) {
        await prisma.title.upsert({
            where: { id: BigInt(TITLES.indexOf(title) + 1) },
            update: {},
            create: title,
        })
    }
}

