import { Router } from 'express';
import {
  JOB_TYPES,
  scanIntakeSchema,
  sourcesNeedingRetry,
  actionPlanProgressUpdateSchema,
  filterActionPlanCompletedTaskIds,
  type ScanIntake,
  type PortalPresentation,
} from '@growthpath/shared';
import { createExportToken, verifyExportToken } from '@growthpath/shared/export-token';
import type { ApiEnv } from '@growthpath/config';
import { kitchen747PortalPresentation } from '@growthpath/shared';
import {
  createScan,
  enqueuePdfExport,
  findSampleScan,
  getScanById,
  getScanResult,
  listScans,
  STALE_RUNNING_MS,
  updateScanPdfExport,
  updateScanStatus,
  updateActionPlanProgress,
  upsertBusiness,
} from '@growthpath/data';
import type { Logger } from '../lib/logger.js';
import { getPresignedDownloadUrl, scanPdfObjectKey } from '../lib/s3.js';
import { publishJob } from '../lib/rabbitmq.js';
import type { Request } from 'express';
import { authMiddleware, requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import type { ScanDocument } from '@growthpath/data';

function scanAccessScope(req: Request) {
  const user = (req as AuthenticatedRequest).currentUser!;
  return {
    userId: user._id.toString(),
    allowAll: user.role === 'admin',
  };
}

function exportTokenSecret(env: ApiEnv): string {
  return env.EXPORT_TOKEN_SECRET ?? env.SESSION_SECRET;
}

function isStaleRunning(startedAt?: Date | string | null): boolean {
  if (!startedAt) return false;
  const startedMs = new Date(startedAt).getTime();
  if (!Number.isFinite(startedMs)) return false;
  return Date.now() - startedMs >= STALE_RUNNING_MS;
}

function actionPlanCompletedTaskIds(scan: ScanDocument | null | undefined): number[] {
  return scan?.actionPlanProgress?.completedTaskIds ?? [];
}

function presentationTaskIds(presentation: PortalPresentation | undefined): number[] {
  return presentation?.tasks.map((task) => task.id) ?? [];
}

function scanResultPayload(
  result: Awaited<ReturnType<typeof getScanResult>>,
  scan?: ScanDocument | null,
) {
  if (!result) return null;
  return {
    scanId: result.scanId.toString(),
    businessId: result.businessId.toString(),
    p1: result.p1,
    p2: result.p2,
    profile: result.profile,
    auditData: result.auditData,
    scores: result.scores,
    createdAt: result.createdAt,
    actionPlanCompletedTaskIds: actionPlanCompletedTaskIds(scan),
  };
}

export function createScansRouter(env: ApiEnv, log: Logger) {
  const router = Router();

  if (!env.EXPORT_TOKEN_SECRET) {
    log.warn('EXPORT_TOKEN_SECRET is not set; falling back to SESSION_SECRET for export tokens. Set EXPORT_TOKEN_SECRET to align with the worker.');
  }

  /** Token-gated export data for print/PDF rendering (no session cookie required). */
  router.get('/:id/export/data', asyncHandler(async (req, res) => {
    const scanId = String(req.params.id);
    const token = String(req.query.token ?? '');
    if (!verifyExportToken(token, scanId, exportTokenSecret(env))) {
      res.status(401).json({ error: 'Invalid or expired export token' });
      return;
    }

    const scan = await getScanById(scanId);
    if (!scan) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }

    if (scan.status !== 'complete' && scan.status !== 'partial') {
      res.status(409).json({ error: 'Scan result not ready', status: scan.status });
      return;
    }

    const result = await getScanResult(scanId);
    if (!result) {
      res.status(404).json({ error: 'Scan result not found' });
      return;
    }

    res.json(scanResultPayload(result, scan));
  }));

  router.use(authMiddleware(env));

  router.get('/sample', requireAuth, asyncHandler(async (req, res) => {
    const currentUser = (req as AuthenticatedRequest).currentUser!;
    const sampleScan = await findSampleScan(
      currentUser._id,
      kitchen747PortalPresentation.seedKey,
    );

    if (!sampleScan) {
      res.status(404).json({ error: 'Sample scan not found' });
      return;
    }

    const scanId = sampleScan._id.toString();

    if (sampleScan.status !== 'complete' && sampleScan.status !== 'partial') {
      res.status(409).json({
        error: 'Sample scan result not ready',
        status: sampleScan.status,
        scanId,
      });
      return;
    }

    const result = await getScanResult(scanId);
    if (!result) {
      res.status(404).json({ error: 'Sample scan result not found', scanId });
      return;
    }

    res.json(scanResultPayload(result, sampleScan));
  }));

  router.get('/', requireAuth, async (req, res) => {
    try {
      const requestedLimit = Math.floor(Number(req.query.limit));
      const limit =
        Number.isFinite(requestedLimit) && requestedLimit > 0
          ? Math.min(requestedLimit, 100)
          : 50;
      const user = (req as AuthenticatedRequest).currentUser!;
      const scans = await listScans(limit, { userId: user._id.toString(), allowAll: false });
      res.json({ scans });
    } catch (error) {
      log.error({ error }, 'Failed to list scans');
      res.status(500).json({ error: 'Failed to list scans' });
    }
  });

  router.post('/', requireAuth, async (req, res) => {
    const parsed = scanIntakeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    let newScan: Awaited<ReturnType<typeof createScan>> | undefined;
    try {
      const intake: ScanIntake = parsed.data;
      const currentUser = (req as AuthenticatedRequest).currentUser!;
      const business = await upsertBusiness(intake);
      newScan = await createScan(business._id, intake.scanTier, {
        userId: currentUser._id,
      });

      await publishJob(env, log, {
        type: JOB_TYPES.SCAN,
        scanId: newScan._id.toString(),
        enqueuedAt: new Date().toISOString(),
      });

      res.status(202).json({
        scanId: newScan._id.toString(),
        businessId: business._id.toString(),
        status: newScan.status,
      });
    } catch (error) {
      log.error({ error }, 'Failed to enqueue scan');
      if (newScan) {
        try {
          await updateScanStatus(newScan._id.toString(), { status: 'failed', error: 'Enqueue failed' });
        } catch (updateErr) {
          log.error({ error: updateErr, scanId: newScan._id.toString() }, 'Failed to persist scan failure status');
        }
        res.status(500).json({ error: 'Failed to enqueue scan', scanId: newScan._id.toString() });
      } else {
        res.status(500).json({ error: 'Failed to enqueue scan' });
      }
    }
  });

  router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
    const scanId = String(req.params.id);
    const scan = await getScanById(scanId, scanAccessScope(req));
    if (!scan) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }

    res.json({
      id: scan._id.toString(),
      businessId: scan.businessId.toString(),
      scanTier: scan.scanTier,
      status: scan.status,
      startedAt: scan.startedAt,
      completedAt: scan.completedAt,
      totalCost: scan.totalCost,
      partialReasons: scan.partialReasons,
      collectionStatus: scan.collectionStatus ?? [],
      retryOfScanId: scan.retryOfScanId?.toString(),
      retryMode: scan.retryMode,
      pdfExport: scan.pdfExport,
      error: scan.error,
      createdAt: scan.createdAt,
      updatedAt: scan.updatedAt,
    });
  }));

  router.get('/:id/result', requireAuth, asyncHandler(async (req, res) => {
    const scanId = String(req.params.id);
    const scan = await getScanById(scanId, scanAccessScope(req));
    if (!scan) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }

    if (scan.status !== 'complete' && scan.status !== 'partial') {
      res.status(409).json({
        error: 'Scan result not ready',
        status: scan.status,
        collectionStatus: scan.collectionStatus ?? [],
        partialReasons: scan.partialReasons ?? [],
        scanError: scan.error,
      });
      return;
    }

    const result = await getScanResult(scanId);
    if (!result) {
      res.status(404).json({ error: 'Scan result not found' });
      return;
    }

    res.json(scanResultPayload(result, scan));
  }));

  router.put('/:id/action-plan', requireAuth, asyncHandler(async (req, res) => {
    const scanId = String(req.params.id);
    const scan = await getScanById(scanId, scanAccessScope(req));
    if (!scan) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }

    if (scan.status !== 'complete' && scan.status !== 'partial') {
      res.status(409).json({ error: 'Scan result not ready', status: scan.status });
      return;
    }

    const parsed = actionPlanProgressUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const result = await getScanResult(scanId);
    if (!result) {
      res.status(404).json({ error: 'Scan result not found' });
      return;
    }

    const presentation = (result.auditData as { presentation?: PortalPresentation }).presentation;
    const validTaskIds = presentationTaskIds(presentation);
    if (validTaskIds.length === 0) {
      res.status(409).json({ error: 'Scan has no action plan tasks' });
      return;
    }

    const completedTaskIds = filterActionPlanCompletedTaskIds(
      parsed.data.completedTaskIds,
      validTaskIds,
    );

    const updated = await updateActionPlanProgress(scanId, completedTaskIds);
    if (!updated) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }

    res.json({ actionPlanCompletedTaskIds: actionPlanCompletedTaskIds(updated) });
  }));

  router.post('/:id/export/pdf', requireAuth, asyncHandler(async (req, res) => {
    const scanId = String(req.params.id);
    let scan = await getScanById(scanId, scanAccessScope(req));
    if (!scan) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }

    if (scan.status !== 'complete' && scan.status !== 'partial') {
      res.status(409).json({ error: 'Scan result not ready', status: scan.status });
      return;
    }

    if (scan.pdfExport?.status === 'running' && isStaleRunning(scan.pdfExport.requestedAt)) {
      await updateScanPdfExport(scanId, {
        ...scan.pdfExport,
        status: 'failed',
        error: 'Previous export timed out',
      });
      scan = await getScanById(scanId, scanAccessScope(req));
      if (!scan) {
        res.status(404).json({ error: 'Scan not found' });
        return;
      }
    }

    const enqueued = await enqueuePdfExport(scanId, {
      requestedAt: new Date(),
      s3Key: scanPdfObjectKey(scanId),
    });
    if (!enqueued) {
      const existing = await getScanById(scanId, scanAccessScope(req));
      res.status(409).json({
        error: 'PDF export already in progress',
        pdfExport: existing?.pdfExport,
      });
      return;
    }

    try {
      const exportToken = createExportToken(scanId, exportTokenSecret(env));
      await publishJob(env, log, {
        type: JOB_TYPES.EXPORT_PDF,
        scanId,
        exportToken,
        enqueuedAt: new Date().toISOString(),
      });

      res.status(202).json({
        message: 'PDF export queued. Refresh scan status for download link when complete.',
        pdfExport: enqueued.pdfExport,
      });
    } catch (error) {
      log.error({ error, scanId }, 'Failed to enqueue PDF export');
      const current = await getScanById(scanId, scanAccessScope(req));
      if (current?.pdfExport?.status === 'queued') {
        try {
          await updateScanPdfExport(scanId, {
            ...current.pdfExport,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Enqueue failed',
          });
        } catch (updateErr) {
          log.error({ error: updateErr, scanId }, 'Failed to persist PDF enqueue failure status');
        }
      }
      res.status(500).json({ error: 'Failed to enqueue PDF export' });
    }
  }));

  router.get('/:id/export/pdf', requireAuth, asyncHandler(async (req, res) => {
    const scanId = String(req.params.id);
    const scan = await getScanById(scanId, scanAccessScope(req));
    if (!scan) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }

    if (scan.pdfExport?.status !== 'complete' || !scan.pdfExport.s3Key) {
      res.status(409).json({
        error: 'PDF not ready',
        pdfExport: scan.pdfExport ?? null,
      });
      return;
    }

    try {
      const downloadUrl = await getPresignedDownloadUrl(env, scan.pdfExport.s3Key);
      res.json({
        downloadUrl,
        expiresInSeconds: 3600,
        pdfExport: scan.pdfExport,
      });
    } catch (error) {
      log.error({ error, scanId }, 'Failed to create PDF download URL');
      res.status(500).json({ error: 'Failed to create PDF download URL' });
    }
  }));

  router.post('/:id/retry', requireAuth, asyncHandler(async (req, res) => {
    const scanId = String(req.params.id);
    const prior = await getScanById(scanId, scanAccessScope(req));
    if (!prior) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }

    if (prior.status === 'queued' || (prior.status === 'running' && !isStaleRunning(prior.startedAt))) {
      res.status(409).json({ error: 'Scan is still in progress' });
      return;
    }

    let newScan: Awaited<ReturnType<typeof createScan>> | undefined;
    try {
      newScan = await createScan(prior.businessId, prior.scanTier, {
        userId: prior.userId ?? (req as AuthenticatedRequest).currentUser!._id,
        retryOfScanId: scanId,
        retryMode: 'full',
      });

      await publishJob(env, log, {
        type: JOB_TYPES.SCAN,
        scanId: newScan._id.toString(),
        retryOfScanId: scanId,
        retryMode: 'full',
        enqueuedAt: new Date().toISOString(),
      });

      res.status(202).json({
        scanId: newScan._id.toString(),
        retryOfScanId: scanId,
        retryMode: 'full',
        status: newScan.status,
      });
    } catch (error) {
      log.error({ error, scanId }, 'Failed to enqueue scan retry');
      if (newScan) {
        try {
          await updateScanStatus(newScan._id.toString(), { status: 'failed', error: 'Enqueue failed' });
        } catch (updateErr) {
          log.error({ error: updateErr, scanId: newScan._id.toString() }, 'Failed to persist scan failure status');
        }
        res.status(500).json({ error: 'Failed to enqueue scan retry', scanId: newScan._id.toString() });
      } else {
        res.status(500).json({ error: 'Failed to enqueue scan retry' });
      }
    }
  }));

  router.post('/:id/retry-sources', requireAuth, asyncHandler(async (req, res) => {
    const scanId = String(req.params.id);
    const prior = await getScanById(scanId, scanAccessScope(req));
    if (!prior) {
      res.status(404).json({ error: 'Scan not found' });
      return;
    }

    if (prior.status !== 'partial' && prior.status !== 'complete' && prior.status !== 'failed') {
      res.status(409).json({ error: 'Scan must be finished before retrying sources', status: prior.status });
      return;
    }

    const priorResult = await getScanResult(scanId);
    const priorCollectionStatus = prior.collectionStatus ?? [];
    const fallbackCollectionStatus = (priorResult?.auditData as { collection_status?: unknown } | undefined)
      ?.collection_status;
    const collectionStatus =
      Array.isArray(priorCollectionStatus) && priorCollectionStatus.length > 0
        ? priorCollectionStatus
        : Array.isArray(fallbackCollectionStatus)
          ? fallbackCollectionStatus
          : [];

    const sourcesToRetry = sourcesNeedingRetry(collectionStatus);
    if (sourcesToRetry.length === 0) {
      res.status(409).json({ error: 'No recoverable missing sources to retry' });
      return;
    }

    let newScan: Awaited<ReturnType<typeof createScan>> | undefined;
    try {
      newScan = await createScan(prior.businessId, prior.scanTier, {
        userId: prior.userId ?? (req as AuthenticatedRequest).currentUser!._id,
        retryOfScanId: scanId,
        retryMode: 'missing_sources',
      });

      await publishJob(env, log, {
        type: JOB_TYPES.SCAN,
        scanId: newScan._id.toString(),
        retryOfScanId: scanId,
        retryMode: 'missing_sources',
        sourcesToRetry,
        enqueuedAt: new Date().toISOString(),
      });

      res.status(202).json({
        scanId: newScan._id.toString(),
        retryOfScanId: scanId,
        retryMode: 'missing_sources',
        sourcesToRetry,
        status: newScan.status,
      });
    } catch (error) {
      log.error({ error, scanId }, 'Failed to enqueue source retry');
      if (newScan) {
        try {
          await updateScanStatus(newScan._id.toString(), { status: 'failed', error: 'Enqueue failed' });
        } catch (updateErr) {
          log.error({ error: updateErr, scanId: newScan._id.toString() }, 'Failed to persist scan failure status');
        }
        res.status(500).json({ error: 'Failed to enqueue source retry', scanId: newScan._id.toString() });
      } else {
        res.status(500).json({ error: 'Failed to enqueue source retry' });
      }
    }
  }));

  return router;
}
