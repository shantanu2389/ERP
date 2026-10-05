import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/academic', async (_req: AuthRequest, res: Response) => {
  try {
    const [examTimetable, placementScheduled] = await Promise.all([
      prisma.exam.findMany({ orderBy: { examDate: 'asc' }, take: 8 }),
      prisma.placementDrive.findMany({ orderBy: { scheduledDate: 'asc' }, take: 8 }),
    ]);
    res.json({ success: true, examTimetable, placementScheduled });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
