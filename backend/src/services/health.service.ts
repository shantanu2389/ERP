import { prisma } from '../prisma';

export async function getHealthStatus() {
  const userCount = await prisma.user.count();

  return {
    status: 'UP' as const,
    timestamp: new Date().toISOString(),
    service: 'College ERP Backend Modular Monolith API',
    database: 'Connected',
    metrics: { activeUsers: userCount },
  };
}
