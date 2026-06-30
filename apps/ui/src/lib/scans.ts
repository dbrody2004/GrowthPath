import type { CollectionSourceId, SourceCollectionResult } from '@growthpath/shared';
import { apiFetch } from './api.js';

export interface ScanSummary {
  id: string;
  businessId: string;
  scanTier: string;
  status: import('@growthpath/shared').ScanStatus;
  startedAt?: string;
  completedAt?: string;
  totalCost?: number;
  partialReasons: string[];
  collectionStatus: SourceCollectionResult[];
  retryOfScanId?: string;
  retryMode?: 'full' | 'missing_sources';
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScanListEntry {
  id: string;
  bizName: string;
  status: import('@growthpath/shared').ScanStatus;
  p1: number | null;
  p2: number | null;
  createdAt: string;
}

export interface AdminScanEntry extends ScanListEntry {
  ownerEmail: string | null;
}

export interface CreateScanResponse {
  scanId: string;
  businessId: string;
  status: import('@growthpath/shared').ScanStatus;
}

export interface RetryScanResponse {
  scanId: string;
  retryOfScanId: string;
  retryMode: 'full' | 'missing_sources';
  sourcesToRetry?: CollectionSourceId[];
  status: import('@growthpath/shared').ScanStatus;
}

export interface ScanResultResponse {
  scanId: string;
  businessId: string;
  p1: number;
  p2: number;
  profile: string;
  auditData: import('@growthpath/shared').AuditData;
  scores: import('@growthpath/shared').Scores;
  createdAt: string;
  actionPlanCompletedTaskIds?: number[];
}

export async function createScan(intake: import('@growthpath/shared').ScanIntake): Promise<CreateScanResponse> {
  return apiFetch<CreateScanResponse>('/api/scans', {
    method: 'POST',
    body: JSON.stringify(intake),
  });
}

export async function getScan(id: string): Promise<ScanSummary> {
  return apiFetch<ScanSummary>(`/api/scans/${encodeURIComponent(id)}`);
}

export async function getScanResult(id: string): Promise<ScanResultResponse> {
  return apiFetch<ScanResultResponse>(`/api/scans/${encodeURIComponent(id)}/result`);
}

export async function listScans(limit = 50): Promise<ScanListEntry[]> {
  const response = await apiFetch<{ scans: ScanListEntry[] }>(`/api/scans?limit=${limit}`);
  return response.scans;
}

export async function listAllScansAdmin(limit = 100): Promise<AdminScanEntry[]> {
  const response = await apiFetch<{ scans: AdminScanEntry[] }>(`/api/admin/scans?limit=${limit}`);
  return response.scans;
}

export async function getSampleScan(): Promise<ScanResultResponse | null> {
  try {
    return await apiFetch<ScanResultResponse>('/api/scans/sample');
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message === 'Sample scan not found' || err.message === 'Sample scan result not found')
    ) {
      return null;
    }
    throw err;
  }
}

export async function retryScan(id: string): Promise<RetryScanResponse> {
  return apiFetch<RetryScanResponse>(`/api/scans/${encodeURIComponent(id)}/retry`, { method: 'POST' });
}

export async function retryScanSources(id: string): Promise<RetryScanResponse> {
  return apiFetch<RetryScanResponse>(`/api/scans/${encodeURIComponent(id)}/retry-sources`, { method: 'POST' });
}

export async function updateActionPlanProgress(
  scanId: string,
  completedTaskIds: number[],
): Promise<{ actionPlanCompletedTaskIds: number[] }> {
  return apiFetch<{ actionPlanCompletedTaskIds: number[] }>(
    `/api/scans/${encodeURIComponent(scanId)}/action-plan`,
    {
      method: 'PUT',
      body: JSON.stringify({ completedTaskIds }),
    },
  );
}
