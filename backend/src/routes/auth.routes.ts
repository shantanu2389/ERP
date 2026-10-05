import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';
import crypto from 'crypto';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'college_erp_super_secure_jwt_secret_key_2026_dev';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production.');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || (process.env.NODE_ENV === 'production' ? '15m' : '7d');
const challenges = new Map<string, { answer: string; expiresAt: number }>();

// Lightweight first-party challenge for the demo portal. In production, replace this
// with hCaptcha/Cloudflare Turnstile and verify the token server-side.
router.get('/challenge', (_req: Request, res: Response) => {
  const now = Date.now();
  for (const [challengeId, challenge] of challenges) {
    if (challenge.expiresAt < now) challenges.delete(challengeId);
  }
  // Prevent a burst of anonymous challenge requests from growing this map
  // without bound in the local server or behind a misconfigured proxy.
  if (challenges.size >= 5000) challenges.clear();
  const id = crypto.randomUUID();
  const answer = String(Math.floor(1000 + Math.random() * 9000));
  challenges.set(id, { answer, expiresAt: now + 5 * 60 * 1000 });
  return res.json({ success: true, challengeId: id, question: answer });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password, expectedRole, challengeId, challengeAnswer } = req.body; // email or rollNo or employeeId

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identifier and password are required' });
    }

    const challenge = challengeId ? challenges.get(String(challengeId)) : undefined;
    if (!challenge || challenge.expiresAt < Date.now() || challenge.answer !== String(challengeAnswer || '').trim()) {
      return res.status(400).json({ success: false, message: 'Please complete the human verification challenge.' });
    }
    challenges.delete(String(challengeId));

    // Try finding by email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase().trim() },
          { studentProfile: { rollNo: identifier.toUpperCase().trim() } },
          { teacherProfile: { employeeId: identifier.toUpperCase().trim() } },
        ],
      },
      include: {
        studentProfile: {
          include: {
            department: true,
            classSection: true,
          },
        },
        teacherProfile: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: `Account is ${user.status}. Contact ERP administrator.` });
    }

    if (expectedRole === 'ADMIN' && !['ERP_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return res.status(403).json({ success: false, message: 'This account is not authorized for the ERP Admin portal.' });
    }
    if (expectedRole === 'TEACHER' && user.role !== 'TEACHER') {
      return res.status(403).json({ success: false, message: 'Please use the Student or ERP Admin portal for this account.' });
    }
    if (expectedRole === 'STUDENT' && user.role !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Please use the Faculty or ERP Admin portal for this account.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
    }

    // Re-issuing a session id invalidates any older browser/device session.
    const sessionId = crypto.randomUUID();
    await prisma.user.update({ where: { id: user.id }, data: { activeSessionId: sessionId } });

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        sessionId,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    const permissions = user.permissions ? user.permissions.split(',').map((p) => p.trim()) : [];

    // Log login in audit
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userRole: user.role,
        userName: user.name,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: user.id,
        ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Web Portal',
      },
    });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        permissions,
        studentProfile: user.studentProfile,
        teacherProfile: user.teacherProfile,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during login' });
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  await prisma.user.update({ where: { id: req.user!.id }, data: { activeSessionId: null } });
  return res.json({ success: true, message: 'Signed out from this device.' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        studentProfile: {
          include: {
            department: true,
            classSection: true,
          },
        },
        teacherProfile: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const permissions = user.permissions ? user.permissions.split(',').map((p) => p.trim()) : [];

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status,
        permissions,
        studentProfile: user.studentProfile,
        teacherProfile: user.teacherProfile,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/forgot-password-request
router.post('/forgot-password-request', async (req: Request, res: Response) => {
  const { rollOrEmail } = req.body;
  if (!rollOrEmail) {
    return res.status(400).json({ success: false, message: 'Please provide email or Student Roll number' });
  }

  // Simulated OTP dispatch
  return res.json({
    success: true,
    message: `Password reset verification token sent to registered email for ${rollOrEmail}. In demo mode, contact ERP Admin.`,
  });
});

export default router;
