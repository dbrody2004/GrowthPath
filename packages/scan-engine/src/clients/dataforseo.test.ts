import { describe, expect, it, vi } from 'vitest';
import {
  DFS_REVIEWS_POLL_INTERVAL_MS,
  DFS_REVIEWS_POLL_TIMEOUT_MS,
} from '../constants.js';
import { createDataForSeoClient } from '../clients/dataforseo.js';

describe('DataForSeoClient pollReviews', () => {
  it('polls until success within 120s timeout', async () => {
    vi.useFakeTimers();
    let pollCalls = 0;
    const fetchFn = vi.fn(async (url: string) => {
      if (url.includes('task_get')) {
        pollCalls += 1;
        if (pollCalls < 2) {
          return {
            json: async () => ({
              tasks: [{ status_code: 40602, status_message: 'In Queue' }],
            }),
          };
        }
        return {
          json: async () => ({
            tasks: [{ status_code: 20000, result: [{ items: [] }] }],
          }),
        };
      }
      return {
        json: async () => ({ tasks: [{ id: 'task-123' }] }),
      };
    }) as unknown as typeof fetch;

    const client = createDataForSeoClient('login', 'pass', fetchFn);
    const taskId = await client.taskPost('business_data/google/reviews/task_post', [{ cid: 1 }]);
    const promise = client.pollReviews(taskId);

    await vi.advanceTimersByTimeAsync(DFS_REVIEWS_POLL_INTERVAL_MS * 2);
    const result = await promise;

    expect(result).not.toBeNull();
    expect(pollCalls).toBeGreaterThanOrEqual(2);
    expect(DFS_REVIEWS_POLL_TIMEOUT_MS).toBe(120_000);
    expect(DFS_REVIEWS_POLL_INTERVAL_MS).toBe(5_000);
    vi.useRealTimers();
  });

  it('returns null after 120s timeout', async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn(async () => ({
      json: async () => ({
        tasks: [{ status_code: 40602 }],
      }),
    })) as unknown as typeof fetch;

    const client = createDataForSeoClient('login', 'pass', fetchFn);
    const promise = client.pollReviews('task-timeout');

    await vi.advanceTimersByTimeAsync(DFS_REVIEWS_POLL_TIMEOUT_MS + DFS_REVIEWS_POLL_INTERVAL_MS);
    const result = await promise;

    expect(result).toBeNull();
    vi.useRealTimers();
  });
});
