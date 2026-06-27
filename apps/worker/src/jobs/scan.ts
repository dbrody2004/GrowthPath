import type { ScanJobMessage, ScanIntake } from '@growthpath/shared';
import { deriveScanStatusFromCollection, mergeCollectionStatus, sourcesNeedingRetry } from '@growthpath/shared';
import type { WorkerEnv } from '@growthpath/config';
import { calculateScores } from '@growthpath/scoring-engine';
import { runScan } from '@growthpath/scan-engine';
import {
  claimScan,
  getBusinessById,
  getScanById,
  getScanResult,
  saveScanResult,
  updateScanStatus,
} from '@growthpath/data';
import type { Logger } from '../lib/logger.js';

function businessToIntake(business: Awaited<ReturnType<typeof getBusinessById>>) {
  if (!business) throw new Error('Business not found');
  return {
    bizName: business.bizName,
    bizAddress: business.bizAddress,
    bizDomain: business.bizDomain,
    bizCity: business.bizCity,
    bizVertical: business.bizVertical,
    bizType: business.bizType,
    verticalKey: business.verticalKey,
    gbpPrimaryCategory: business.gbpPrimaryCategory,
    bizTier: business.bizTier as ScanIntake['bizTier'],
    scanTier: business.scanTier as ScanIntake['scanTier'],
    ownerServices: business.ownerServices,
  };
}

export async function handleScanJob(
  message: ScanJobMessage,
  env: WorkerEnv,
  log: Logger,
): Promise<void> {
  const scan = await getScanById(message.scanId);
  if (!scan) {
    throw new Error(`Scan not found: ${message.scanId}`);
  }

  // Skip only truly terminal states; 'running' is omitted so redelivered jobs
  // from crashed workers can be re-attempted via claimScan (queued-only).
  if (['complete', 'partial', 'failed'].includes(scan.status)) {
    log.warn({ scanId: message.scanId, status: scan.status }, 'Scan already in terminal status, skipping');
    return;
  }

  const business = await getBusinessById(scan.businessId);
  if (!business) {
    throw new Error(`Business not found for scan: ${message.scanId}`);
  }

  const claimed = await claimScan(message.scanId);
  if (!claimed) {
    log.warn({ scanId: message.scanId }, 'Scan already claimed or in terminal status, skipping');
    return;
  }

  log.info({ scanId: message.scanId, retryMode: message.retryMode }, 'Starting scan collection');

  try {
    const intake = businessToIntake(business);
    const useMock = env.NODE_ENV === 'test' || env.SCAN_MOCK;

    let priorAudit;
    let sourcesToRetry = message.sourcesToRetry;

    const retryMode = message.retryMode ?? scan.retryMode;
    const retryOfScanId = message.retryOfScanId ?? scan.retryOfScanId?.toString();
    if (retryOfScanId) {
      const priorResult = await getScanResult(retryOfScanId);
      if (priorResult?.auditData) {
        priorAudit = priorResult.auditData as unknown as import('@growthpath/shared').AuditData;
      }
      if (retryMode === 'missing_sources' && !sourcesToRetry?.length) {
        if (priorAudit?.collection_status) {
          sourcesToRetry = sourcesNeedingRetry(priorAudit.collection_status);
        } else {
          const priorScan = await getScanById(retryOfScanId);
          if (priorScan?.collectionStatus?.length) {
            sourcesToRetry = sourcesNeedingRetry(priorScan.collectionStatus);
          }
        }
      }
    }

    if (retryMode === 'missing_sources' && !sourcesToRetry?.length) {
      throw new Error(
        'missing_sources retry requires sourcesToRetry or prior scan collection status',
      );
    }

    const auditData = await runScan(intake, env, {
      mock: useMock,
      priorAudit,
      sourcesToRetry,
    });
    const scores = calculateScores(auditData);

    const collectionStatus = auditData.collection_status ?? [];
    const { status, partialReasons } = deriveScanStatusFromCollection(collectionStatus);

    await saveScanResult({
      scanId: scan._id,
      businessId: scan.businessId,
      auditData: auditData as unknown as Record<string, unknown>,
      scores: scores as unknown as Record<string, unknown>,
      p1: scores.p1,
      p2: scores.p2,
      profile: scores.profile,
    });

    await updateScanStatus(message.scanId, {
      status,
      completedAt: new Date(),
      totalCost: auditData.total_cost ?? 0,
      partialReasons,
      collectionStatus,
    });

    log.info(
      {
        scanId: message.scanId,
        p1: scores.p1,
        p2: scores.p2,
        profile: scores.profile,
        status,
        partialReasons,
      },
      'Scan completed',
    );
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Scan failed';
    log.error({ scanId: message.scanId, error: errMessage }, 'Scan failed');
    const meta =
      error && typeof error === 'object' && 'sourceCollectionMeta' in error
        ? (error as { sourceCollectionMeta: import('@growthpath/shared').SourceCollectionResult })
            .sourceCollectionMeta
        : undefined;
    const collectionStatus = meta
      ? mergeCollectionStatus(scan.collectionStatus, [meta])
      : scan.collectionStatus;
    try {
      await updateScanStatus(message.scanId, {
        status: 'failed',
        completedAt: new Date(),
        error: errMessage,
        ...(collectionStatus?.length ? { collectionStatus } : {}),
      });
    } catch (updateErr) {
      log.error({ scanId: message.scanId, error: updateErr }, 'Failed to persist scan failure status');
      throw error;
    }
  }
}
