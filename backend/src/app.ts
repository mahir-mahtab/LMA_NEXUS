import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import workspaceRoutes from './routes/workspace.routes.js';
import draftRoutes from './routes/draft.routes.js';
import graphRoutes from './routes/graph.routes.js';
import auditRoutes from './routes/audit.routes.js';
import driftRoutes from './routes/drift.routes.js';
import goldenRecordRoutes from './routes/goldenRecord.routes.js';
import reconciliationRoutes from './routes/reconciliation.routes.js';

// Initialize Express app
const app: Express = express();

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API version prefix
app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({
    message: 'LMA Nexus API v1',
    version: '1.0.0',
    documentation: '/api/v1/docs',
  });
});

// ============================================
// ROUTES
// ============================================

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/drafts', draftRoutes);
app.use('/api/v1/graph', graphRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/drifts', driftRoutes);
app.use('/api/v1/golden-records', goldenRecordRoutes);
app.use('/api/v1/reconciliations', reconciliationRoutes);

// TODO: Add remaining routes
// app.use('/api/v1/users', userRoutes);
// app.use('/api/v1/documents', documentRoutes);

// ============================================
// 404 HANDLER
// ============================================

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
});

// ============================================
// ERROR HANDLER
// ============================================

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
});

export default app;
