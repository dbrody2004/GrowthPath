import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.js';
import type { ApiEnv } from '@growthpath/config';

export type AuthenticatedRequest = Request & {
  currentUser?: InstanceType<typeof User>;
};

export function authMiddleware(env: ApiEnv) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const token = req.header('x-session-token');
    if (!token) {
      next();
      return;
    }

    try {
      const hashed = crypto.createHash('sha256').update(`${token}:${env.SESSION_SECRET}`).digest('hex');
      const user = await User.findOne({ sessionToken: hashed });
      if (user) {
        (req as AuthenticatedRequest).currentUser = user;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as AuthenticatedRequest).currentUser) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

export function createSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashSessionToken(token: string, secret: string): string {
  return crypto.createHash('sha256').update(`${token}:${secret}`).digest('hex');
}
