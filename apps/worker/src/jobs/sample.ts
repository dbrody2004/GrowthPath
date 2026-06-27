import { JOB_TYPES, type JobMessage } from '@growthpath/shared';
import type { Logger } from '../lib/logger.js';

export async function handleSampleJob(job: JobMessage, log: Logger): Promise<void> {
  if (job.type !== JOB_TYPES.SAMPLE) return;
  log.info({ payload: job.payload }, 'Handled sample job');
}
