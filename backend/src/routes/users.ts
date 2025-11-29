import express from 'express';
import { z } from 'zod';
import prisma from '../utils/db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticate, requireRole(['ADMIN']), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                avatarUrl: true,
                createdAt: true,
            },
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const updateRoleSchema = z.object({
    role: z.enum(['READER', 'MEMBER', 'ADMIN']),
});

// Update user role (Admin only)
router.patch('/:id/role', authenticate, requireRole(['ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = updateRoleSchema.parse(req.body);

        const user = await prisma.user.update({
            where: { id },
            data: { role },
        });

        res.json({
            id: user.id,
            role: user.role,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: error.issues });
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

const updateProfileSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    avatarUrl: z.string().url().optional(),
});

// Update own profile
router.patch('/me', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const data = updateProfileSchema.parse(req.body);

        const user = await prisma.user.update({
            where: { id: userId },
            data: data,
        });

        res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            avatarUrl: user.avatarUrl,
        });
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
