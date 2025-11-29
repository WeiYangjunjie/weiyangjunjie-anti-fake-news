import express from 'express';
import { z } from 'zod';
import prisma from '../utils/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { verifyToken } from '../utils/jwt';

const router = express.Router();

// Get all news (with pagination and filters)
router.get('/', async (req, res) => {
    try {
        const { page = '1', pageSize = '10', status, q, includeDeleted } = req.query;
        const pageNum = parseInt(page as string);
        const pageSizeNum = parseInt(pageSize as string);

        // Check for admin role to see deleted news (only when explicitly requested)
        let isAdmin = false;
        const authHeader = req.headers.authorization;
        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = verifyToken(token);
                if (decoded.role === 'ADMIN') {
                    isAdmin = true;
                }
            } catch (e) {
                // Ignore invalid token, treat as guest/reader
            }
        }

        const where: any = {};

        // Only show deleted news when the caller is admin AND explicitly asks for it
        const includeDeletedFlag = includeDeleted === 'true';
        if (!(isAdmin && includeDeletedFlag)) {
            where.isDeleted = false;
        }

        if (status) {
            where.status = status;
        }

        if (q) {
            where.OR = [
                { topic: { contains: q as string } },
                { shortDetail: { contains: q as string } },
                { fullDetail: { contains: q as string } },
            ];
        }

        const [news, total] = await prisma.$transaction([
            prisma.news.findMany({
                where,
                skip: (pageNum - 1) * pageSizeNum,
                take: pageSizeNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    reporter: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatarUrl: true,
                        },
                    },
                    votes: true, // Include votes to aggregate manually if needed, or use grouping
                    _count: {
                        select: { comments: { where: { isDeleted: false } } },
                    },
                },
            }),
            prisma.news.count({ where }),
        ]);

        // Aggregate votes
        const newsWithVotes = news.map((item) => {
            const fakeVotes = item.votes.filter((v) => v.vote === 'FAKE').length;
            const notFakeVotes = item.votes.filter((v) => v.vote === 'NOT_FAKE').length;
            const { votes, ...rest } = item;
            return {
                ...rest,
                voteCounts: {
                    fake: fakeVotes,
                    notFake: notFakeVotes,
                    total: fakeVotes + notFakeVotes,
                },
            };
        });

        res.json({
            data: newsWithVotes,
            pagination: {
                page: pageNum,
                pageSize: pageSizeNum,
                total,
                totalPages: Math.ceil(total / pageSizeNum),
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single news
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check for admin role and get current userId if token存在
        let isAdmin = false;
        let currentUserId: string | null = null;
        const authHeader = req.headers.authorization;
        if (authHeader) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = verifyToken(token);
                currentUserId = decoded.userId;
                if (decoded.role === 'ADMIN') {
                    isAdmin = true;
                }
            } catch (e) {
                // Ignore invalid token
            }
        }

        const news = await prisma.news.findUnique({
            where: { id },
            include: {
                reporter: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
                votes: true,
                _count: {
                    select: { comments: { where: { isDeleted: false } } },
                },
            },
        });

        if (!news) {
            res.status(404).json({ error: 'News not found' });
            return;
        }

        if (news.isDeleted && !isAdmin) {
            res.status(404).json({ error: 'News not found' });
            return;
        }

        // Aggregate votes + 当前用户已投
        const fakeVotes = news.votes.filter((v) => v.vote === 'FAKE').length;
        const notFakeVotes = news.votes.filter((v) => v.vote === 'NOT_FAKE').length;
        const userVote = currentUserId ? news.votes.find((v) => v.userId === currentUserId)?.vote || null : null;
        const { votes, ...rest } = news;

        res.json({
            ...rest,
            voteCounts: {
                fake: fakeVotes,
                notFake: notFakeVotes,
                total: fakeVotes + notFakeVotes,
            },
            userVote,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const createNewsSchema = z.object({
    topic: z.string().min(1),
    shortDetail: z.string().min(1),
    fullDetail: z.string().min(1),
    imageUrl: z.string().optional(),
});

// Create news (Member only)
router.post('/', authenticate, requireRole(['MEMBER', 'ADMIN']), async (req: AuthRequest, res) => {
    try {
        const { topic, shortDetail, fullDetail, imageUrl } = createNewsSchema.parse(req.body);

        const news = await prisma.news.create({
            data: {
                topic,
                shortDetail,
                fullDetail,
                imageUrl,
                reporterId: req.user!.userId,
            },
        });

        res.status(201).json(news);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.issues });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

const updateStatusSchema = z.object({
    status: z.enum(['UNKNOWN', 'FAKE', 'NOT_FAKE']),
});

// Update news status (Member/Admin? Plan says Member can post, Admin can delete. Who updates status? Usually community or Admin. Let's allow Admin.)
// Plan says: "News: ... PATCH /news/:id (含 status 更新)"
// Let's allow ADMIN to update status.
router.patch('/:id', authenticate, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = updateStatusSchema.parse(req.body);

        const news = await prisma.news.update({
            where: { id },
            data: { status },
        });

        res.json(news);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.issues });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Soft delete/restore (Admin only)
router.patch('/:id/visibility', authenticate, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { isDeleted } = req.body; // Expect boolean

        if (typeof isDeleted !== 'boolean') {
            res.status(400).json({ error: 'isDeleted must be a boolean' });
            return;
        }

        const news = await prisma.news.update({
            where: { id },
            data: { isDeleted },
        });

        res.json(news);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
