import { describe, expect, it } from 'vitest';
import { apiEnvSchema, loadApiEnv } from './index.js';

const scanCreds = {
  GOOGLE_API_KEY: 'test-google-key',
  DFS_LOGIN: 'test-dfs-login',
  DFS_PASSWORD: 'test-dfs-password',
  CENSUS_API_KEY: '',
  MOZ_API_KEY: '',
};

describe('config', () => {
  it('parses valid API env', () => {
    const env = loadApiEnv({
      MONGODB_URI: 'mongodb://127.0.0.1:27118/growthpath',
      RABBITMQ_URL: 'amqp://guest:guest@127.0.0.1:5674',
      S3_ENDPOINT: 'http://127.0.0.1:9004',
      S3_ACCESS_KEY_ID: 'minioadmin',
      S3_SECRET_ACCESS_KEY: 'minioadmin',
      S3_BUCKET: 'growthpath',
      SESSION_SECRET: 'test-session-secret-1234',
      ...scanCreds,
    });

    expect(env.API_PORT).toBe(3001);
    expect(env.S3_FORCE_PATH_STYLE).toBe(true);
  });

  it('rejects missing required values', () => {
    expect(() => loadApiEnv({})).toThrow(/Invalid environment configuration/);
  });

  it('coerces boolean env strings', () => {
    const parsed = apiEnvSchema.parse({
      MONGODB_URI: 'mongodb://127.0.0.1:27118/growthpath',
      RABBITMQ_URL: 'amqp://guest:guest@127.0.0.1:5674',
      S3_ENDPOINT: 'http://127.0.0.1:9004',
      S3_ACCESS_KEY_ID: 'minioadmin',
      S3_SECRET_ACCESS_KEY: 'minioadmin',
      S3_BUCKET: 'growthpath',
      SESSION_SECRET: 'test-session-secret-1234',
      S3_FORCE_PATH_STYLE: 'false',
      ...scanCreds,
    });

    expect(parsed.S3_FORCE_PATH_STYLE).toBe(false);
  });
});
