import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import type { Options } from 'pino-http';
import type { ApiEnv } from '@growthpath/config';
import type { Logger } from './lib/logger.js';
import { createAuthRouter } from './routes/auth.js';
import { createAdminRouter } from './routes/admin.js';
import { createJobsRouter } from './routes/jobs.js';
import { createScansRouter } from './routes/scans.js';

export function createApp(env: ApiEnv, log: Logger) {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(
    pinoHttp({
      logger: log,
      redact: {
        paths: [
          'req.headers["x-session-token"]',
          'req.headers.authorization',
          'req.query.token',
        ],
        remove: true,
      },
    } as Options),
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: 'api' });
  });

  app.use('/api/auth', createAuthRouter(env, log));
  app.use('/api/admin', createAdminRouter(env, log));
  app.use('/api/jobs', createJobsRouter(env, log));
  app.use('/api/scans', createScansRouter(env, log));

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Global error handler — must be last and have 4 params so Express treats it as error middleware
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    log.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
