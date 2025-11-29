import express from 'express';
import { z } from 'zod';
import prisma from '../utils/db';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router({ mergeParams: true });

// Get comments for a news (Nested: /news/:newsId/comments)
router.get('/', async (req, res) => {
    try {
        const { newsId } = req.params as { newsId?: string };

        if (!newsId) {
            // If mounted at /comments, this might be invalid unless we want all comments?
            // For now, assume this is only for nested usage or we require query param?
            // Let's stick to nested for GET.
            res.status(400).json({ error: 'News ID is required' });
            return;
        }

        const { page = '1', pageSize = '10' } = req.query;
        const pageNum = parseInt(page as string);
        const pageSizeNum = parseInt(pageSize as string);

        const where = {
            newsId,
            isDeleted: false,
        };

        const [comments, total] = await prisma.$transaction([
            prisma.comment.findMany({
                where,
                skip: (pageNum - 1) * pageSizeNum,
                take: pageSizeNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatarUrl: true,
                        },
                    },
                },
            }),
            prisma.comment.count({ where }),
        ]);

        res.json({
            data: comments,
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

const createCommentSchema = z.object({
    content: z.string().min(1),
    imageUrl: z.string().optional(),
});

// Post a comment (Nested: /news/:newsId/comments)
router.post('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const { newsId } = req.params as { newsId?: string };
        const { content, imageUrl } = createCommentSchema.parse(req.body);

        if (!newsId) {
            res.status(400).json({ error: 'News ID is required' });
            return;
        }

        const comment = await prisma.comment.create({
            data: {
                newsId,
                userId: req.user!.userId,
                content,
                imageUrl,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true
                    }
                }
            }
        });

        res.status(201).json(comment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.issues });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Delete a comment (Global: /comments/:id)
// This route will be hit when mounted at /comments and path is /:id
router.delete('/:id', authenticate, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if comment exists
        const existingComment = await prisma.comment.findUnique({ where: { id } });
        if (!existingComment) {
            res.status(404).json({ error: 'Comment not found' });
            return;
        }

        // Soft delete
        const comment = await prisma.comment.update({
            where: { id },
            data: { isDeleted: true }
        });

        // Recalculate votes?
        // User said: "删除后联动重算票数/删除关联 vote" (Delete linked votes or recalculate score)
        // If the score is just vote count, deleting a comment doesn't affect it unless votes are ON comments.
        // But the schema says Vote has newsId, not commentId.
        // So votes are on NEWS.
        // Maybe the user implies "Recalculate news score if score = votes + comments"?
        // Or maybe they meant "If I delete a comment, I should also delete any votes associated with it?" (But votes are on news)
        // Wait, "删除评论...重算得分" (Delete comment... recalculate score).
        // If score = votes + comments, then deleting a comment reduces score.
        // Since we calculate counts dynamically in GET /news, we don't need to "recalculate" and store it, unless we store it.
        // We don't store score. So just soft deleting is enough for the count to decrease (since we filter isDeleted: false).

        // However, user also said: "删除关联投票（若前端把评论与投票绑定则票数会错误）"
        // This implies maybe votes CAN be on comments?
        // Checking schema: Vote has newsId, userId. No commentId.
        // So votes are on NEWS.
        // Maybe user thinks votes are on comments? Or maybe they mean "If a user commented AND voted, and we delete the comment, should we delete the vote?"
        // That sounds weird.
        // Let's assume "Recalculate score" means "Ensure the comment count decreases".
        // Since we use `_count` in Prisma and filter `isDeleted: false` (we need to make sure we do), it should be fine.
        // Wait, in `news.ts`, `_count: { select: { comments: true } }` counts ALL comments, including deleted ones unless we filter.
        // Prisma `_count` doesn't automatically filter.
        // We need to fix `news.ts` to count only non-deleted comments.

        // Let's fix `news.ts` later to filter comments count.
        // For now, let's just implement soft delete here.

        res.json(comment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
