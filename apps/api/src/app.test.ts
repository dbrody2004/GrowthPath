import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
import { createLogger } from './lib/logger.js';
import type { ApiEnv } from '@growthpath/config';

const testEnv: ApiEnv = {
  APP_NAME: 'growthpath',
  NODE_ENV: 'test',
  LOG_LEVEL: 'error',
  API_HOST: '127.0.0.1',
  API_PORT: 3001,
  CORS_ORIGIN: 'http://localhost:5173',
  MONGODB_URI: 'mongodb://127.0.0.1:27118/growthpath',
  RABBITMQ_URL: 'amqp://guest:guest@127.0.0.1:5674',
  RABBITMQ_PREFETCH: 10,
  S3_ENDPOINT: 'http://127.0.0.1:9004',
  S3_REGION: 'us-east-1',
  S3_ACCESS_KEY_ID: 'minioadmin',
  S3_SECRET_ACCESS_KEY: 'minioadmin',
  S3_BUCKET: 'growthpath',
  S3_FORCE_PATH_STYLE: true,
  SESSION_SECRET: 'test-session-secret-1234',
  SEED_ADMIN_EMAIL: 'admin@example.com',
  SEED_ADMIN_PASSWORD: 'change-me',
  GOOGLE_API_KEY: 'test-google-key',
  DFS_LOGIN: 'test-dfs-login',
  DFS_PASSWORD: 'test-dfs-password',
  CENSUS_API_KEY: '',
  MOZ_API_KEY: '',
};

describe('health route', () => {
  it('returns healthy status', async () => {
    const app = createApp(testEnv, createLogger(testEnv));
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'healthy', service: 'api' });
  });
});

describe('scan routes', () => {
  it('requires authentication', async () => {
    const app = createApp(testEnv, createLogger(testEnv));
    const response = await request(app).get('/api/scans');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });
});
