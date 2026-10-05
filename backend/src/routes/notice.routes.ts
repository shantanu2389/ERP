import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notices (Public/Authenticated)
router.get('/', async (req, res) => {
  try {
    const { category, audience } = req.query;

    const where: any = {};
    if (category) where.category = category as string;
    if (audience) where.targetAudience = { in: ['ALL', audience as string] };

    const notices = await prisma.notice.findMany({
      where,
      include: {
        author: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, notices });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/notices (Admin & Teacher only)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!['SUPER_ADMIN', 'ERP_ADMIN', 'TEACHER'].includes(req.user!.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: only faculty or admins can publish notices' });
    }

    const { title, content, category, targetAudience, priority } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        category: category || 'GENERAL',
        targetAudience: targetAudience || 'ALL',
        priority: priority || 'NORMAL',
        authorId: req.user!.id,
      },
      include: {
        author: { select: { name: true, role: true } },
      },
    });

    return res.json({ success: true, message: 'Notice published', notice });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
