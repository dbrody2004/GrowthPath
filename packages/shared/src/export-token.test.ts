import { describe, expect, it } from 'vitest';
import { createExportToken, verifyExportToken } from './export-token.js';

describe('export token', () => {
  it('creates and verifies a valid token', () => {
    const token = createExportToken('scan-123', 'test-secret');
    expect(verifyExportToken(token, 'scan-123', 'test-secret')).toBe(true);
  });

  it('rejects wrong scan id', () => {
    const token = createExportToken('scan-123', 'test-secret');
    expect(verifyExportToken(token, 'scan-other', 'test-secret')).toBe(false);
  });

  it('rejects tampered token', () => {
    const token = createExportToken('scan-123', 'test-secret');
    expect(verifyExportToken(`${token}x`, 'scan-123', 'test-secret')).toBe(false);
  });
});
