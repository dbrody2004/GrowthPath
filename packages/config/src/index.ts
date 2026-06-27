import { z } from 'zod';
import { loadProjectDotenv } from './load-dotenv.js';

const boolFromEnv = z
  .union([z.boolean(), z.string()])
  .transform((value) => {
    if (typeof value === 'boolean') return value;
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  });

export const baseEnvSchema = z.object({
  APP_NAME: z.string().default('growthpath'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SCAN_MOCK: boolFromEnv.default(false),
});

export const scanCredentialsSchema = z.object({
  GOOGLE_API_KEY: z.string().min(1),
  CENSUS_API_KEY: z.string().default(''),
  DFS_LOGIN: z.string().min(1),
  DFS_PASSWORD: z.string().min(1),
  MOZ_API_KEY: z.string().default(''),
});

export const apiEnvSchema = baseEnvSchema.extend({
  API_HOST: z.string().default('0.0.0.0'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1),
  RABBITMQ_URL: z.string().min(1),
  RABBITMQ_PREFETCH: z.coerce.number().int().positive().default(10),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_FORCE_PATH_STYLE: boolFromEnv.default(true),
  SESSION_SECRET: z.string().min(16),
  SEED_ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
  SEED_ADMIN_PASSWORD_HASH: z.string().min(20).optional(),
  SEED_SAMPLE_USER_EMAIL: z.string().email().default('davex814@gmail.com'),
  SEED_SAMPLE_USER_PASSWORD: z.string().min(8).optional(),
  SEED_SAMPLE_USER_PASSWORD_HASH: z.string().min(20).optional(),
  UI_ORIGIN: z.string().url().default('http://localhost:5173'),
  EXPORT_TOKEN_SECRET: z.string().min(16).optional(),
}).merge(scanCredentialsSchema);

export const workerEnvSchema = baseEnvSchema.extend({
  MONGODB_URI: z.string().min(1),
  RABBITMQ_URL: z.string().min(1),
  RABBITMQ_PREFETCH: z.coerce.number().int().positive().default(10),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_FORCE_PATH_STYLE: boolFromEnv.default(true),
  UI_ORIGIN: z.string().url().default('http://localhost:5173'),
  SESSION_SECRET: z.string().min(16).optional(),
  EXPORT_TOKEN_SECRET: z.string().min(16).optional(),
  PDF_EXPORT_MOCK: boolFromEnv.default(false),
}).merge(scanCredentialsSchema);

export type BaseEnv = z.infer<typeof baseEnvSchema>;
export type ScanCredentials = z.infer<typeof scanCredentialsSchema>;
export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;

export function loadEnv<T extends z.ZodTypeAny>(
  schema: T,
  source: NodeJS.ProcessEnv = process.env,
): z.infer<T> {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return parsed.data;
}

export function loadApiEnv(source?: NodeJS.ProcessEnv): ApiEnv {
  if (!source) {
    loadProjectDotenv();
  }
  return loadEnv(apiEnvSchema, source);
}

export function loadWorkerEnv(source?: NodeJS.ProcessEnv): WorkerEnv {
  if (!source) {
    loadProjectDotenv();
  }
  return loadEnv(workerEnvSchema, source);
}

export { preflightScanCredentials } from './preflight-scan.js';
export type { ScanPreflightResult, ScanSourceCapability } from './preflight-scan.js';
