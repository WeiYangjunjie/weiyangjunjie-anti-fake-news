import express from 'express';
import { z } from 'zod';
import prisma from '../utils/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router({ mergeParams: true });

const voteSchema = z.object({
    vote: z.enum(['FAKE', 'NOT_FAKE']),
});

// Vote on news
router.post('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { newsId } = req.params;
        const { vote } = voteSchema.parse(req.body);
        const userId = req.user!.userId;

        if (!newsId) {
            res.status(400).json({ error: 'News ID is required' });
            return;
        }

        // Check if news exists and is not deleted/hidden
        const news = await prisma.news.findUnique({
            where: { id: newsId },
        });

        if (!news) {
            res.status(404).json({ error: 'News not found' });
            return;
        }

        if (news.isDeleted) {
            res.status(404).json({ error: 'News not found' });
            return;
        }

        // Check if already voted
        const existingVote = await prisma.vote.findUnique({
            where: {
                newsId_userId: {
                    newsId,
                    userId,
                },
            },
        });

        if (existingVote) {
            res.status(400).json({ error: 'You have already voted on this news.' });
            return;
        }

        const newVote = await prisma.vote.create({
            data: {
                newsId,
                userId,
                vote,
            },
        });
        res.status(201).json(newVote);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.issues });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

export default router;
