import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CompetitorServiceExplorer } from '../components/dashboard/CompetitorServiceExplorer.js';
import { InteractiveActionPlan } from '../components/dashboard/InteractiveActionPlan.js';
import { CompetitorComparison } from '../components/report/CompetitorComparison.js';
import { CompetitorIntelPanel } from '../components/report/CompetitorIntelPanel.js';
import { CompetitorLeaderboard } from '../components/report/CompetitorLeaderboard.js';
import { KeywordCards } from '../components/report/KeywordCards.js';
import { RankMap } from '../components/report/RankMap.js';
import { ReportOverviewTab } from '../components/report/ReportOverviewTab.js';
import { SampleAnalyticsPanel } from '../components/report/SampleAnalyticsPanel.js';
import { SampleReportsPanel } from '../components/report/SampleReportsPanel.js';
import { SampleSearchConsolePanel } from '../components/report/SampleSearchConsolePanel.js';
import { ScoreHeader } from '../components/report/ScoreHeader.js';
import { ScanCollectionStatusPanel } from '../components/ScanCollectionStatusPanel.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  getScan,
  getScanResult,
  retryScan,
  retryScanSources,
  type ScanResultResponse,
  type ScanSummary,
} from '../lib/scans.js';

type ReportTab =
  | 'overview'
  | 'actionplan'
  | 'rankmap'
  | 'competitors'
  | 'keywords'
  | 'analytics'
  | 'searchconsole'
  | 'reports';

const BASE_TABS: Array<{ id: ReportTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'rankmap', label: 'Rank Map' },
  { id: 'competitors', label: 'Competitors' },
  { id: 'keywords', label: 'Keywords' },
];

const PRESENTATION_TABS: Array<{ id: ReportTab; label: string }> = [
  { id: 'actionplan', label: 'Action Plan' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'searchconsole', label: 'Search Console' },
  { id: 'reports', label: 'Reports' },
];

const POLL_MS = 3000;
const EMPTY_TASK_IDS: number[] = [];

export function ScanReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<ScanSummary | null>(null);
  const [result, setResult] = useState<ScanResultResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [retryBusy, setRetryBusy] = useState(false);

  useEffect(() => {
    setActiveTab('overview');
  }, [id]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let generation = 0;

    async function poll() {
      const currentGeneration = generation;
      try {
        const summary = await getScan(id!);
        if (cancelled || currentGeneration !== generation) return;

        setScan(summary);
        setError(null);

        if (summary.status === 'complete' || summary.status === 'partial') {
          const scanResult = await getScanResult(id!);
          if (!cancelled && currentGeneration === generation) {
            setResult(scanResult);
            setLoading(false);
          }
          return;
        }

        if (summary.status === 'failed') {
          setLoading(false);
          return;
        }

        timer = setTimeout(poll, POLL_MS);
      } catch (pollError) {
        if (!cancelled && currentGeneration === generation) {
          setError(pollError instanceof Error ? pollError.message : 'Failed to load scan');
          setLoading(false);
        }
      }
    }

    setLoading(true);
    setScan(null);
    setResult(null);
    setError(null);
    generation++;
    poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  async function handleRetryFull() {
    if (!id || retryBusy) return;
    setRetryBusy(true);
    try {
      const response = await retryScan(id);
      navigate(`/scans/${encodeURIComponent(response.scanId)}`);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'Retry failed');
    } finally {
      setRetryBusy(false);
    }
  }

  async function handleRetrySources() {
    if (!id || retryBusy) return;
    setRetryBusy(true);
    try {
      const response = await retryScanSources(id);
      navigate(`/scans/${encodeURIComponent(response.scanId)}`);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'Source retry failed');
    } finally {
      setRetryBusy(false);
    }
  }

  const collectionSources =
    scan?.collectionStatus?.length
      ? scan.collectionStatus
      : result?.auditData.collection_status ?? [];

  const canRetrySources =
    scan &&
    (scan.status === 'partial' || scan.status === 'complete' || scan.status === 'failed') &&
    collectionSources.some((s) => s.status !== 'ok' && s.status !== 'skipped');

  if (!id) {
    return <p className="form-error">Missing scan id.</p>;
  }

  const presentation = result?.auditData.presentation;
  const tabs = presentation
    ? [
        BASE_TABS[0],
        ...PRESENTATION_TABS.filter((tab) => {
          if (tab.id === 'actionplan') return presentation.tasks.length > 0;
          if (tab.id === 'analytics') return Boolean(presentation.ga4);
          if (tab.id === 'searchconsole') return Boolean(presentation.gsc);
          if (tab.id === 'reports') return presentation.reports.length > 0;
          return false;
        }),
        ...BASE_TABS.slice(1),
      ]
    : BASE_TABS;

  return (
    <div className="report-page">
      <div className="page-header">
        <div>
          <Link to="/scans" className="back-link">
            ← All scans
          </Link>
          <h2>Scan Report</h2>
          {scan && scan.status !== 'complete' && (
            <p className="muted">
              <StatusBadge status={scan.status} />
            </p>
          )}
        </div>
        {scan && (scan.status === 'failed' || scan.status === 'partial' || canRetrySources) && (
          <div className="scan-retry-actions">
            <button type="button" className="btn-secondary" disabled={retryBusy} onClick={handleRetryFull}>
              Retry full scan
            </button>
            {canRetrySources && (
              <button type="button" className="btn-secondary" disabled={retryBusy} onClick={handleRetrySources}>
                Retry missing sources
              </button>
            )}
          </div>
        )}
      </div>

      {loading && !result && !error && (
        <section className="card report-card">
          <p className="muted">Scan in progress… checking every few seconds.</p>
          {scan?.collectionStatus && scan.collectionStatus.length > 0 && (
            <ScanCollectionStatusPanel sources={scan.collectionStatus} />
          )}
        </section>
      )}

      {error && (
        <section className="card report-card banner banner-error">
          <p>{error}</p>
        </section>
      )}

      {scan?.status === 'failed' && (
        <section className="card report-card banner banner-error">
          <p>Scan failed{scan.error ? `: ${scan.error}` : '.'}</p>
        </section>
      )}

      {(scan?.status === 'partial' || scan?.status === 'complete' || scan?.status === 'failed') && (
        <ScanCollectionStatusPanel
          sources={collectionSources}
          partialReasons={scan.partialReasons}
        />
      )}

        {result && (
          <>
            <div className="report-export-actions no-print">
              <Link to={`/scans/${encodeURIComponent(id!)}/print`} className="btn-secondary">
                Open printable report
              </Link>
            </div>

            <ScoreHeader scores={result.scores} />

          <nav className="report-tabs" aria-label="Report sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? 'report-tab active' : 'report-tab'}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="report-tab-panel">
            {activeTab === 'overview' && <ReportOverviewTab scores={result.scores} />}

            {activeTab === 'actionplan' && presentation && (
              <InteractiveActionPlan
                scanId={result.scanId}
                presentation={presentation}
                initialCompletedTaskIds={result.actionPlanCompletedTaskIds ?? EMPTY_TASK_IDS}
                onProgressChange={(completedTaskIds) =>
                  setResult((prev) =>
                    prev ? { ...prev, actionPlanCompletedTaskIds: completedTaskIds } : prev,
                  )
                }
              />
            )}

            {activeTab === 'analytics' && presentation?.ga4 && (
              <SampleAnalyticsPanel ga4={presentation.ga4} p2Score={result.p2} />
            )}

            {activeTab === 'searchconsole' && presentation?.gsc && (
              <SampleSearchConsolePanel gsc={presentation.gsc} />
            )}

            {activeTab === 'reports' && presentation?.reports && (
              <SampleReportsPanel reports={presentation.reports} />
            )}

            {activeTab === 'rankmap' && <RankMap auditData={result.auditData} />}

            {activeTab === 'competitors' &&
              (presentation?.competitors ? (
                <CompetitorServiceExplorer
                  competitors={presentation.competitors}
                  city={result.auditData.city}
                />
              ) : (
                <>
                  <CompetitorLeaderboard rows={result.scores.competitor_leaderboard ?? []} />
                  {result.scores.competitor_intel && (
                    <>
                      <CompetitorIntelPanel competitor={result.scores.competitor_intel} />
                      <CompetitorComparison competitor={result.scores.competitor_intel} />
                    </>
                  )}
                </>
              ))}

            {activeTab === 'keywords' && <KeywordCards auditData={result.auditData} />}
          </div>
        </>
      )}
    </div>
  );
}
