import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import type { ApiEnv } from '@growthpath/config';
import type { Logger } from '../lib/logger.js';
import { validateBody, loginSchema, changePasswordSchema } from '../lib/validate.js';
import { User, hashPassword, toUserDto } from '../models/user.js';
import {
  authMiddleware,
  createSessionToken,
  hashSessionToken,
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const currentUser = (req as AuthenticatedRequest).currentUser;
  if (!currentUser || currentUser.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
}

export function createAuthRouter(env: ApiEnv, log: Logger) {
  const router = Router();
  router.use(authMiddleware(env));

  router.post('/login', validateBody(loginSchema), asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = createSessionToken();
    user.sessionToken = hashSessionToken(token, env.SESSION_SECRET);
    await user.save();

    res.json({ token, user: toUserDto(user) });
  }));

  router.post('/logout', requireAuth, asyncHandler(async (req, res) => {
    const currentUser = (req as AuthenticatedRequest).currentUser!;
    currentUser.sessionToken = null;
    await currentUser.save();
    res.json({ ok: true });
  }));

  router.post('/change-password', requireAuth, validateBody(changePasswordSchema), asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };
    const currentUser = (req as AuthenticatedRequest).currentUser!;

    if (!(await currentUser.comparePassword(currentPassword))) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    currentUser.passwordHash = await hashPassword(newPassword);
    currentUser.sessionToken = null;
    await currentUser.save();

    res.json({ ok: true });
  }));

  router.get('/me', requireAuth, (req, res) => {
    res.json({ user: toUserDto((req as AuthenticatedRequest).currentUser!) });
  });

  router.get('/health', (_req, res) => {
    const mongoReady = mongoose.connection.readyState === 1;
    res.json({
      status: mongoReady ? 'healthy' : 'degraded',
      service: 'api',
      mongo: mongoReady ? 'connected' : 'disconnected',
    });
  });

  router.get('/users', requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
    const users = await User.find().sort({ createdAt: -1 }).limit(50);
    res.json({ users: users.map(toUserDto) });
  }));

  router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    log.error({ error }, 'Auth route error');
    res.status(500).json({ error: 'Internal server error' });
  });

  return router;
}
