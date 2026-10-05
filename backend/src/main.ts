import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import teacherRoutes from './routes/teacher.routes';
import adminRoutes from './routes/admin.routes';
import noticeRoutes from './routes/notice.routes';
import { prisma } from './prisma';
import healthRoutes from './routes/health.routes';
import scheduleRoutes from './routes/schedule.routes';

const app = express();
const PORT = process.env.PORT || 5000;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
  throw new Error('CORS_ORIGIN must be configured in production.');
}

// CORS configuration: never combine credentials with a wildcard origin.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Small in-memory guard for the local/demo server. Put the API behind a reverse
// proxy/WAF with distributed rate limiting in production.
app.use('/api/auth/login', (req: Request, res: Response, next: NextFunction) => {
  const key = String(req.ip || req.socket.remoteAddress || 'unknown');
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || current.resetAt < now) loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
  else if (current.count >= 10) return res.status(429).json({ success: false, message: 'Too many sign-in attempts. Please wait 15 minutes.' });
  else current.count += 1;
  next();
});

// Request logger for visibility
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[API] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notices', noticeRoutes);

// Health check endpoint
app.use('/api/health', healthRoutes);
app.use('/api/schedule', scheduleRoutes);

// Global 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 College ERP Backend API running at http://localhost:${PORT}`);
  console.log(`📡 Health check available at http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`${signal} signal received: closing HTTP server`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Prisma disconnected, HTTP server closed');
  });
};

process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
process.on('SIGINT', () => { void shutdown('SIGINT'); });
