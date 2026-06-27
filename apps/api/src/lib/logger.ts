import pino from 'pino';
import type { ApiEnv } from '@growthpath/config';

export function createLogger(env: ApiEnv) {
  return pino({
    level: env.LOG_LEVEL,
    transport:
      env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  });
}

export type Logger = ReturnType<typeof createLogger>;
