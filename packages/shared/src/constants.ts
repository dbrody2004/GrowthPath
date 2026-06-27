export const APP_NAME = 'growthpath';

export const QUEUE = {
  EXCHANGE: `${APP_NAME}.jobs`,
  MAIN_QUEUE: `${APP_NAME}.jobs.main`,
  DLX: `${APP_NAME}.jobs.dlx`,
  DLQ: `${APP_NAME}.jobs.dlq`,
  ROUTING_KEY: 'job',
} as const;

export const JOB_TYPES = {
  SAMPLE: 'sample',
  SCAN: 'scan',
  EXPORT_PDF: 'export_pdf',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];
