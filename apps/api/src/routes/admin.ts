import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import type { ApiEnv } from '@growthpath/config';
import { listAllScans } from '@growthpath/data';
import type { Logger } from '../lib/logger.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { User } from '../models/user.js';
import { authMiddleware, requireAuth } from '../middleware/auth.js';
import { requireAdmin } from './auth.js';

export function createAdminRouter(env: ApiEnv, log: Logger) {
  const router = Router();
  router.use(authMiddleware(env));

  router.get('/scans', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
    const requestedLimit = Math.floor(Number(req.query.limit));
    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 100)
        : 100;

    const scans = await listAllScans(limit);
    const userIds = [...new Set(scans.map((scan) => scan.userId).filter(Boolean))] as string[];

    const users = userIds.length > 0
      ? await User.find({ _id: { $in: userIds } }).select('email')
      : [];
    const emailByUserId = new Map(users.map((user) => [user._id.toString(), user.email]));

    res.json({
      scans: scans.map((scan) => ({
        ...scan,
        ownerEmail: scan.userId ? emailByUserId.get(scan.userId) ?? null : null,
      })),
    });
  }));

  router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    log.error({ error }, 'Admin route error');
    res.status(500).json({ error: 'Internal server error' });
  });

  return router;
}
