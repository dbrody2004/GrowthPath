import { describe, expect, it } from 'vitest';

function parseReviewDt(review: Record<string, unknown>): Date | null {
  for (const key of ['timestamp', 'datetime', 'time']) {
    const val = review[key];
    if (val == null) continue;
    if (typeof val === 'number') return new Date(val);
    if (typeof val === 'string') {
      try {
        const normalized = val.includes('T')
          ? val.replace('Z', '+00:00')
          : val.replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) /, '$1T$2');
        const dt = new Date(normalized.replace(' ', ''));
        if (!Number.isNaN(dt.getTime())) return dt;
      } catch {
        // continue
      }
    }
  }
  return null;
}

describe('GBP review parsing helpers', () => {
  it('parses DFS timestamp format', () => {
    const dt = parseReviewDt({ timestamp: '2024-05-05 14:09:32 +00:00' });
    expect(dt?.getUTCFullYear()).toBe(2024);
    expect(dt?.getUTCMonth()).toBe(4);
  });

  it('documents CID precision requirement', () => {
    const cid = '14804337392168465641';
    expect(parseInt(cid, 10).toString()).not.toBe(cid);
    expect(String(cid)).toBe('14804337392168465641');
  });
});
