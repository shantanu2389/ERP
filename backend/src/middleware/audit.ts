import { AuthRequest } from './auth';
import { prisma } from '../prisma';

export interface AuditLogParams {
  req: AuthRequest;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
}

export async function logAuditEvent({
  req,
  action,
  entityType,
  entityId,
  oldValue,
  newValue,
}: AuditLogParams) {
  try {
    const userId = req.user?.id || 'SYSTEM';
    const userRole = req.user?.role || 'SYSTEM';
    const userName = req.user?.name || 'Automated Process';
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'API Client';

    await prisma.auditLog.create({
      data: {
        userId,
        userRole,
        userName,
        action,
        entityType,
        entityId,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
