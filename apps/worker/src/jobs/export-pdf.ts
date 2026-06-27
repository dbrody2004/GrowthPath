import type { WorkerEnv } from '@growthpath/config';
import type { ExportPdfJobMessage } from '@growthpath/shared';
import { createExportToken } from '@growthpath/shared/export-token';
import { claimPdfExport, getScanById, updateScanPdfExport } from '@growthpath/data';
import { scanPdfObjectKey } from '../lib/s3.js';
import type { Logger } from '../lib/logger.js';
import { putObject } from '../lib/s3.js';
import { renderScanPdf } from '../lib/pdf.js';

export async function handleExportPdfJob(
  message: ExportPdfJobMessage,
  env: WorkerEnv,
  log: Logger,
): Promise<void> {
  const scan = await getScanById(message.scanId);
  if (!scan) {
    throw new Error(`Scan not found: ${message.scanId}`);
  }

  // Skip only truly terminal states; 'running' is omitted so redelivered jobs
  // from crashed workers can be re-attempted via claimPdfExport (queued-only).
  if (['complete', 'failed'].includes(scan.pdfExport?.status ?? '')) {
    log.warn({ scanId: message.scanId, status: scan.pdfExport?.status }, 'PDF export already in terminal status, skipping');
    return;
  }

  const s3Key = scanPdfObjectKey(message.scanId);
  const claimedPdf = await claimPdfExport(message.scanId, {
    requestedAt: scan.pdfExport?.requestedAt ?? new Date(),
    s3Key,
  });
  if (!claimedPdf) {
    log.warn({ scanId: message.scanId }, 'PDF export already claimed or not queued, skipping');
    return;
  }

  log.info({ scanId: message.scanId }, 'Starting PDF export');

  try {
    const useMock = env.NODE_ENV === 'test' || env.PDF_EXPORT_MOCK;
    let pdfBuffer: Buffer;
    if (useMock) {
      pdfBuffer = Buffer.from('%PDF-1.4 mock');
    } else {
      const exportSecret = env.EXPORT_TOKEN_SECRET ?? env.SESSION_SECRET;
      if (!exportSecret) {
        throw new Error('PDF export requires EXPORT_TOKEN_SECRET or SESSION_SECRET');
      }
      const exportToken = createExportToken(message.scanId, exportSecret);
      pdfBuffer = await renderScanPdf(env, message.scanId, exportToken);
    }

    await putObject(env, s3Key, pdfBuffer, 'application/pdf');

    await updateScanPdfExport(message.scanId, {
      status: 'complete',
      s3Key,
      requestedAt: scan.pdfExport?.requestedAt ?? new Date(),
      completedAt: new Date(),
    });

    log.info({ scanId: message.scanId, s3Key }, 'PDF export complete');
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'PDF export failed';
    log.error({ scanId: message.scanId, error: errMessage }, 'PDF export failed');
    try {
      await updateScanPdfExport(message.scanId, {
        status: 'failed',
        s3Key,
        error: errMessage,
        requestedAt: scan.pdfExport?.requestedAt ?? new Date(),
        completedAt: new Date(),
      });
    } catch (updateErr) {
      log.error({ scanId: message.scanId, error: updateErr }, 'Failed to persist PDF export failure status');
      throw error;
    }
  }
}
