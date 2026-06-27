import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ShareableReportDocument } from '../components/report/ShareableReportDocument.js';
import {
  getScanResult,
  type ScanResultResponse,
} from '../lib/scans.js';
import { getScanExportData, requestPdfExport } from '../lib/export.js';

interface ScanPrintPageProps {
  /** When true, skip session auth and load via export token query param. */
  exportMode?: boolean;
}

export function ScanPrintPage({ exportMode = false }: ScanPrintPageProps) {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? undefined;
  const autoprint = searchParams.get('autoprint') === '1';

  const [result, setResult] = useState<ScanResultResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setResult(null);
    setError(null);
    setLoading(true);

    if (exportMode && !token) {
      setError('Missing or invalid export link');
      setResult(null);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const data =
          exportMode && token
            ? await getScanExportData(id!, token)
            : await getScanResult(id!);
        if (!cancelled) {
          setResult(data);
          setError(null);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setResult(null);
          setError(loadError instanceof Error ? loadError.message : 'Failed to load report');
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, exportMode, token]);

  useEffect(() => {
    if (autoprint && result && !loading && !error) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoprint, result, loading, error]);

  async function handleGeneratePdf() {
    if (!id || exportMode) return;
    setPdfBusy(true);
    setPdfStatus(null);
    try {
      const response = await requestPdfExport(id);
      setPdfStatus(response.message);
    } catch (pdfError) {
      setPdfStatus(pdfError instanceof Error ? pdfError.message : 'PDF export failed');
    } finally {
      setPdfBusy(false);
    }
  }

  if (!id) {
    return <p className="form-error">Missing scan id.</p>;
  }

  return (
    <div className="print-page">
      {!exportMode && (
        <div className="print-toolbar no-print">
          <Link to={`/scans/${encodeURIComponent(id!)}`} className="back-link">
            ← Back to report
          </Link>
          <div className="print-toolbar__actions">
            <button type="button" className="btn-secondary" onClick={() => window.print()}>
              Print / Save as PDF
            </button>
            <button type="button" className="btn-primary" disabled={pdfBusy} onClick={handleGeneratePdf}>
              {pdfBusy ? 'Queueing PDF…' : 'Generate server PDF'}
            </button>
          </div>
          {pdfStatus && <p className="muted print-toolbar__status">{pdfStatus}</p>}
        </div>
      )}

      {error && (
        <section className="card report-card banner banner-error no-print">
          <p>{error}</p>
        </section>
      )}

      {loading && !error && (
        <section className="card report-card no-print">
          <p className="muted">Loading report…</p>
        </section>
      )}

      {result && (
        <ShareableReportDocument
          result={result}
          businessName={result.auditData.business}
          scanDate={result.auditData.scan_date}
        />
      )}
    </div>
  );
}
