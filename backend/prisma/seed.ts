import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10);

    // Create Users
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            passwordHash,
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN',
        },
    });

    const member = await prisma.user.upsert({
        where: { email: 'member@example.com' },
        update: {},
        create: {
            email: 'member@example.com',
            passwordHash,
            firstName: 'Member',
            lastName: 'User',
            role: 'MEMBER',
        },
    });

    const reader = await prisma.user.upsert({
        where: { email: 'reader@example.com' },
        update: {},
        create: {
            email: 'reader@example.com',
            passwordHash,
            firstName: 'Reader',
            lastName: 'User',
            role: 'READER',
        },
    });

    console.log({ admin, member, reader });

    // Create News
    const newsData = Array.from({ length: 25 }).map((_, i) => ({
        topic: `News Topic ${i + 1}`,
        shortDetail: `This is a short detail for news ${i + 1}.`,
        fullDetail: `This is the full detail for news ${i + 1}. It contains more information about the topic.`,
        reporterId: member.id,
        status: i % 3 === 0 ? 'FAKE' : i % 3 === 1 ? 'NOT_FAKE' : 'UNKNOWN',
        imageUrl: `https://picsum.photos/seed/${i}/800/600`,
    }));

    for (const news of newsData) {
        const createdNews = await prisma.news.create({
            data: news,
        });

        // Add comments
        await prisma.comment.create({
            data: {
                newsId: createdNews.id,
                userId: reader.id,
                content: 'This is a comment from a reader.',
            },
        });

        await prisma.comment.create({
            data: {
                newsId: createdNews.id,
                userId: member.id,
                content: 'This is a comment from a member.',
            },
        });

        // Add votes
        await prisma.vote.create({
            data: {
                newsId: createdNews.id,
                userId: reader.id,
                vote: 'NOT_FAKE',
            },
        });

        if (createdNews.status === 'FAKE') {
            await prisma.vote.create({
                data: {
                    newsId: createdNews.id,
                    userId: member.id,
                    vote: 'FAKE',
                },
            });
        }
    }

    console.log('Seeded news with comments and votes');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
