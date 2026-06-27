import { describe, expect, it } from 'vitest';
import { QUEUE } from './constants.js';

describe('queue constants', () => {
  it('uses growthpath prefix', () => {
    expect(QUEUE.EXCHANGE).toBe('growthpath.jobs');
    expect(QUEUE.MAIN_QUEUE).toBe('growthpath.jobs.main');
    expect(QUEUE.DLX).toBe('growthpath.jobs.dlx');
    expect(QUEUE.DLQ).toBe('growthpath.jobs.dlq');
  });
});
