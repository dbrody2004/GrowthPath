import mongoose from 'mongoose';
import type { ScanIntake, ScanStatus, SourceCollectionResult } from '@growthpath/shared';
import type { Types } from 'mongoose';
import {
  Business,
  Scan,
  ScanResult,
  intakeToBusinessFields,
  type BusinessDocument,
  type ScanDocument,
  type ScanResultDocument,
} from '../models/index.js';

export async function upsertBusiness(intake: ScanIntake): Promise<BusinessDocument> {
  const fields = intakeToBusinessFields(intake);
  return Business.findOneAndUpdate(
    { bizDomain: fields.bizDomain, bizCity: fields.bizCity },
    { $set: fields },
    { upsert: true, new: true },
  );
}

export async function createScan(
  businessId: Types.ObjectId,
  scanTier: string,
  options?: {
    userId?: Types.ObjectId;
    sampleSeedKey?: string;
    retryOfScanId?: string;
    retryMode?: 'full' | 'missing_sources';
  },
): Promise<ScanDocument> {
  return Scan.create({
    businessId,
    userId: options?.userId,
    sampleSeedKey: options?.sampleSeedKey,
    scanTier,
    status: 'queued',
    partialReasons: [],
    collectionStatus: [],
    retryOfScanId: options?.retryOfScanId
      ? new mongoose.Types.ObjectId(options.retryOfScanId)
      : undefined,
    retryMode: options?.retryMode,
  });
}

export async function getScanById(
  id: string,
  scope?: { userId?: string; allowAll?: boolean },
): Promise<ScanDocument | null> {
  const scan = await Scan.findById(id);
  if (!scan) return null;
  if (scope?.allowAll || !scope?.userId) return scan;
  if (!scan.userId || scan.userId.toString() !== scope.userId) return null;
  return scan;
}

export async function findSampleScan(
  userId: Types.ObjectId,
  sampleSeedKey: string,
): Promise<ScanDocument | null> {
  return Scan.findOne({ userId, sampleSeedKey }).sort({ createdAt: -1 });
}

export async function getBusinessById(id: Types.ObjectId): Promise<BusinessDocument | null> {
  return Business.findById(id);
}

export async function updateScanStatus(
  scanId: string,
  update: Partial<{
    status: ScanStatus;
    startedAt: Date;
    completedAt: Date;
    totalCost: number;
    partialReasons: string[];
    collectionStatus: SourceCollectionResult[];
    pdfExport: ScanDocument['pdfExport'];
    error: string;
  }>,
): Promise<ScanDocument | null> {
  return Scan.findByIdAndUpdate(scanId, { $set: update }, { new: true });
}

export async function updateScanPdfExport(
  scanId: string,
  pdfExport: NonNullable<ScanDocument['pdfExport']>,
): Promise<ScanDocument | null> {
  return Scan.findByIdAndUpdate(scanId, { $set: { pdfExport } }, { new: true });
}

export async function updateActionPlanProgress(
  scanId: string,
  completedTaskIds: number[],
): Promise<ScanDocument | null> {
  return Scan.findByIdAndUpdate(
    scanId,
    {
      $set: {
        actionPlanProgress: {
          completedTaskIds,
          updatedAt: new Date(),
        },
      },
    },
    { new: true },
  );
}

export const STALE_RUNNING_MS = 30 * 60 * 1000;

export async function claimScan(
  scanId: string,
  staleAfterMs = STALE_RUNNING_MS,
): Promise<ScanDocument | null> {
  const staleBefore = new Date(Date.now() - staleAfterMs);
  return Scan.findOneAndUpdate(
    {
      _id: scanId,
      $or: [
        { status: 'queued' },
        { status: 'running', startedAt: { $lt: staleBefore } },
      ],
    },
    { $set: { status: 'running', startedAt: new Date() } },
    { new: true },
  );
}

export async function enqueuePdfExport(
  scanId: string,
  pdfExportPartial: object,
): Promise<ScanDocument | null> {
  return Scan.findOneAndUpdate(
    {
      _id: scanId,
      $nor: [{ 'pdfExport.status': 'queued' }, { 'pdfExport.status': 'running' }],
    },
    { $set: { pdfExport: { ...pdfExportPartial, status: 'queued' } } },
    { new: true },
  );
}

export async function claimPdfExport(
  scanId: string,
  pdfExportPartial: object,
  staleAfterMs = STALE_RUNNING_MS,
): Promise<ScanDocument | null> {
  const staleBefore = new Date(Date.now() - staleAfterMs);
  return Scan.findOneAndUpdate(
    {
      _id: scanId,
      $or: [
        { 'pdfExport.status': 'queued' },
        {
          'pdfExport.status': 'running',
          'pdfExport.requestedAt': { $lt: staleBefore },
        },
      ],
    },
    { $set: { pdfExport: { ...pdfExportPartial, status: 'running' } } },
    { new: true },
  );
}

export async function saveScanResult(input: {
  scanId: Types.ObjectId;
  businessId: Types.ObjectId;
  auditData: Record<string, unknown>;
  scores: Record<string, unknown>;
  p1: number;
  p2: number;
  profile: string;
}): Promise<ScanResultDocument> {
  return ScanResult.findOneAndUpdate({ scanId: input.scanId }, { $set: input }, { upsert: true, new: true });
}

export async function getScanResult(scanId: string): Promise<ScanResultDocument | null> {
  if (!mongoose.Types.ObjectId.isValid(scanId)) return null;
  return ScanResult.findOne({ scanId: new mongoose.Types.ObjectId(scanId) });
}

export async function getScanWithBusiness(scanId: string) {
  const scan = await Scan.findById(scanId).populate<{ businessId: BusinessDocument }>('businessId');
  return scan;
}

export interface ScanListItem {
  id: string;
  bizName: string;
  status: ScanStatus;
  p1: number | null;
  p2: number | null;
  createdAt: Date;
}

export async function listScans(
  limit = 50,
  scope?: { userId?: string; allowAll?: boolean },
): Promise<ScanListItem[]> {
  const filter =
    scope?.allowAll || !scope?.userId
      ? {}
      : { userId: new mongoose.Types.ObjectId(scope.userId) };

  const scans = await Scan.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate<{ businessId: BusinessDocument }>('businessId')
    .exec();

  if (scans.length === 0) {
    return [];
  }

  const scanIds = scans.map((scan) => scan._id);
  const results = await ScanResult.find({ scanId: { $in: scanIds } })
    .select('scanId p1 p2')
    .lean();

  const resultByScanId = new Map(
    results.map((result) => [result.scanId.toString(), { p1: result.p1, p2: result.p2 }]),
  );

  return scans.map((scan) => {
    const scores = resultByScanId.get(scan._id.toString());
    const business = scan.businessId as BusinessDocument;
    return {
      id: scan._id.toString(),
      bizName: business?.bizName ?? 'Unknown',
      status: scan.status,
      p1: scores?.p1 ?? null,
      p2: scores?.p2 ?? null,
      createdAt: scan.createdAt,
    };
  });
}
