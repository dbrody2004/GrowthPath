import type { ScanResultResponse } from './scans.js';
import { apiFetch } from './api.js';

export async function getScanExportData(scanId: string, token: string): Promise<ScanResultResponse> {
  const params = new URLSearchParams({ token });
  return apiFetch<ScanResultResponse>(`/api/scans/${encodeURIComponent(scanId)}/export/data?${params.toString()}`, {
    skipAuth: true,
  });
}

export async function requestPdfExport(scanId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/scans/${encodeURIComponent(scanId)}/export/pdf`, { method: 'POST' });
}

export async function getPdfExportDownload(scanId: string): Promise<{ downloadUrl: string }> {
  return apiFetch<{ downloadUrl: string }>(`/api/scans/${encodeURIComponent(scanId)}/export/pdf`);
}
