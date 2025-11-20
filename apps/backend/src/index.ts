import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import diaryRoutes from './routes/diary.routes';
import syncRoutes from './routes/sync.routes';
import immichRoutes from './routes/immich.routes';
import authRoutes from './routes/auth.routes';
import settingsRoutes from './routes/settings.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { authService } from './services/auth.service';
import { initScheduler } from './scheduler';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint (public)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Public API routes (no auth required)
app.use('/api/auth', authRoutes);

// Protected API routes (auth required)
app.use('/api/diary', authMiddleware, diaryRoutes);
app.use('/api/immich', authMiddleware, immichRoutes);
app.use('/api/sync', authMiddleware, syncRoutes);
app.use('/api/settings', settingsRoutes); // Has its own auth middleware

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Initialize default admin user if needed
    await authService.initializeDefaultUser();

    // Initialize scheduler
    initScheduler();

    app.listen(port, () => {
      logger.info(`PathLife backend server is running on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('🔒 Authentication enabled - /api routes protected');
    });
  } catch (error: any) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

start();
