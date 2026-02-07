import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import plansRouter from './routes/plans.js';
import ordersRouter from './routes/orders.js';
import webhooksRouter from './routes/webhooks.js';
import adminAuthRouter from './routes/admin/auth.js';
import adminOrdersRouter from './routes/admin/orders.js';
import adminPlansRouter from './routes/admin/plans.js';
import adminAccessesRouter from './routes/admin/accesses.js';
import adminStatsRouter from './routes/admin/stats.js';

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Public routes
app.use('/api/plans', plansRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/webhooks', webhooksRouter);

// Admin routes
app.use('/api/admin', adminAuthRouter);
app.use('/api/admin/orders', adminOrdersRouter);
app.use('/api/admin/plans', adminPlansRouter);
app.use('/api/admin/accesses', adminAccessesRouter);
app.use('/api/admin/stats', adminStatsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Centralized error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

export default app;
