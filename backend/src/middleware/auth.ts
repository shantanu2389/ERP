import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'college_erp_super_secure_jwt_secret_key_2026_dev';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured in production.');
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ERP_ADMIN' | 'TEACHER' | 'STUDENT';
  status: string;
  permissions: string[];
  studentId?: string;
  teacherId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; sessionId?: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, message: 'Invalid or suspended account' });
    }
    if (!decoded.sessionId || user.activeSessionId !== decoded.sessionId) {
      return res.status(401).json({ success: false, message: 'This account is active in another location. Please sign in again here.' });
    }

    const permissions = user.permissions ? user.permissions.split(',').map((p) => p.trim()) : [];

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      status: user.status,
      permissions,
      studentId: user.studentProfile?.id,
      teacherId: user.teacherProfile?.id,
    };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Session expired or invalid token' });
  }
};

export const requireRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: requires one of [${roles.join(', ')}], you have [${req.user.role}]`,
      });
    }

    next();
  };
};

export const requirePermissions = (...requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Super Admin has all permissions
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const hasAll = requiredPermissions.every((perm) => req.user?.permissions.includes(perm));
    if (!hasAll) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: missing permission(s) [${requiredPermissions.join(', ')}]`,
      });
    }

    next();
  };
};
