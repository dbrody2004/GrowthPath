import { describe, expect, it, vi } from 'vitest';
import { handleExportPdfJob } from './export-pdf.js';

const mockGetScanById = vi.fn();
const mockUpdateScanPdfExport = vi.fn();
const mockClaimPdfExport = vi.fn().mockResolvedValue({ _id: 'scan-1' });
const mockPutObject = vi.fn();

vi.mock('@growthpath/data', () => ({
  getScanById: (...args: unknown[]) => mockGetScanById(...args),
  updateScanPdfExport: (...args: unknown[]) => mockUpdateScanPdfExport(...args),
  claimPdfExport: (...args: unknown[]) => mockClaimPdfExport(...args),
}));

vi.mock('../lib/s3.js', () => ({
  putObject: (...args: unknown[]) => mockPutObject(...args),
  scanPdfObjectKey: (scanId: string) => `exports/scans/${scanId}/report.pdf`,
}));

describe('handleExportPdfJob', () => {
  it('uploads mock PDF in test mode', async () => {
    mockGetScanById.mockResolvedValue({
      _id: 'scan-1',
      pdfExport: { requestedAt: new Date() },
    });

    await handleExportPdfJob(
      { type: 'export_pdf', scanId: 'scan-1', exportToken: 'token' },
      {
        NODE_ENV: 'test',
        S3_BUCKET: 'bucket',
        S3_REGION: 'us-east-1',
        S3_ENDPOINT: 'http://localhost:9004',
        S3_ACCESS_KEY_ID: 'key',
        S3_SECRET_ACCESS_KEY: 'secret',
        S3_FORCE_PATH_STYLE: true,
        UI_ORIGIN: 'http://localhost:5173',
      } as never,
      { info: vi.fn(), error: vi.fn() } as never,
    );

    expect(mockPutObject).toHaveBeenCalledWith(
      expect.anything(),
      'exports/scans/scan-1/report.pdf',
      expect.any(Buffer),
      'application/pdf',
    );
    expect(mockUpdateScanPdfExport).toHaveBeenLastCalledWith(
      'scan-1',
      expect.objectContaining({ status: 'complete' }),
    );
  });
});
