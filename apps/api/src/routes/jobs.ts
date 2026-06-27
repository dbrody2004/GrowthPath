import { Router } from 'express';
import { z } from 'zod';
import { JOB_TYPES } from '@growthpath/shared';
import type { ApiEnv } from '@growthpath/config';
import type { Logger } from '../lib/logger.js';
import { publishJob } from '../lib/rabbitmq.js';
import { authMiddleware, requireAuth } from '../middleware/auth.js';
import { requireAdmin } from './auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { validateBody } from '../lib/validate.js';

const enqueueSampleSchema = z.object({
  note: z.string().max(500).optional(),
});

export function createJobsRouter(env: ApiEnv, log: Logger) {
  const router = Router();
  router.use(authMiddleware(env));

  router.post('/enqueue-sample', requireAuth, requireAdmin, validateBody(enqueueSampleSchema), asyncHandler(async (req, res) => {
    const message = {
      type: JOB_TYPES.SAMPLE,
      payload: { note: req.body.note ?? 'sample job' },
      enqueuedAt: new Date().toISOString(),
    };

    await publishJob(env, log, message);
    res.status(202).json({ queued: true, message });
  }));

  return router;
}
