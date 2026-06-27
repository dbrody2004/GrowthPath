import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CompetitorServiceExplorer } from '../components/dashboard/CompetitorServiceExplorer.js';
import { InteractiveActionPlan } from '../components/dashboard/InteractiveActionPlan.js';
import { PortalDashboardExplorer } from '../components/dashboard/PortalDashboardExplorer.js';
import { CompetitorComparison } from '../components/report/CompetitorComparison.js';
import { CompetitorIntelPanel } from '../components/report/CompetitorIntelPanel.js';
import { CompetitorLeaderboard } from '../components/report/CompetitorLeaderboard.js';
import { KeywordCards } from '../components/report/KeywordCards.js';
import { RankMap } from '../components/report/RankMap.js';
import { SampleAnalyticsPanel } from '../components/report/SampleAnalyticsPanel.js';
import { SampleReportsPanel } from '../components/report/SampleReportsPanel.js';
import { SampleSearchConsolePanel } from '../components/report/SampleSearchConsolePanel.js';
import { ScoreHeader } from '../components/report/ScoreHeader.js';
import { getSampleScan, type ScanResultResponse } from '../lib/scans.js';

type DashboardTab =
  | 'dashboard'
  | 'actionplan'
  | 'competitors'
  | 'rankmap'
  | 'keywords'
  | 'analytics'
  | 'searchconsole'
  | 'reports';

const BASE_TABS: Array<{ id: DashboardTab; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'rankmap', label: 'Rank Map' },
  { id: 'competitors', label: 'Competitors' },
  { id: 'keywords', label: 'Keywords' },
];

const PRESENTATION_TABS: Array<{ id: DashboardTab; label: string }> = [
  { id: 'actionplan', label: 'Action Plan' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'searchconsole', label: 'Search Console' },
  { id: 'reports', label: 'Reports' },
];

const EMPTY_TASK_IDS: number[] = [];

export function DashboardPage() {
  const [result, setResult] = useState<ScanResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
  const [pendingTaskRank, setPendingTaskRank] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    getSampleScan()
      .then((sample) => {
        if (!cancelled) setResult(sample);
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load sample scan');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const presentation = result?.auditData.presentation;

  const tabs = useMemo(() => {
    if (!presentation) {
      return BASE_TABS;
    }

    const presentationTabs = PRESENTATION_TABS.filter((tab) => {
      if (tab.id === 'actionplan') return presentation.tasks.length > 0;
      if (tab.id === 'analytics') return Boolean(presentation.ga4);
      if (tab.id === 'searchconsole') return Boolean(presentation.gsc);
      if (tab.id === 'reports') return presentation.reports.length > 0;
      return false;
    });

    return [
      BASE_TABS[0],
      ...presentationTabs,
      ...BASE_TABS.slice(1),
    ];
  }, [presentation]);

  useEffect(() => {
    const tabIds = tabs.map((tab) => tab.id);
    if (!tabIds.includes(activeTab)) {
      setActiveTab(tabIds[0] ?? 'dashboard');
    }
  }, [tabs, activeTab]);

  function handleOpenTask(rank: number) {
    if (!presentation?.tasks.length) return;
    setPendingTaskRank(rank);
    setActiveTab('actionplan');
  }

  if (loading) {
    return (
      <section className="card">
        <p className="muted">Loading dashboard…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card banner banner-error">
        <p>{error}</p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="card">
        <h2>Dashboard</h2>
        <p className="muted">
          No sample scan is available for your account. Run the sample seed or create a new scan to
          get started.
        </p>
        <div className="portal-dashboard__empty-actions">
          <Link to="/scans/new" className="btn-primary">
            New scan
          </Link>
          <Link to="/scans" className="btn-secondary">
            View scans
          </Link>
        </div>
      </section>
    );
  }

  const bizName = result.auditData.business;
  const bizCity = result.auditData.city;

  return (
    <div className="portal-dashboard-page">
      <div className="portal-dashboard-page__header">
        <div>
          <h2>{bizName}{bizCity ? ` · ${bizCity}` : ''}</h2>
          <p className="muted">
            Sample scan · P1 {result.p1} · P2 {result.p2} · {result.profile}
          </p>
        </div>
        <Link to={`/scans/${encodeURIComponent(result.scanId)}`} className="btn-secondary">
          Full scan report
        </Link>
      </div>

      <ScoreHeader scores={result.scores} />

      <nav className="report-tabs" aria-label="Dashboard sections">
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
        {activeTab === 'dashboard' && (
          <PortalDashboardExplorer
            scores={result.scores}
            dashboardSections={presentation?.dashboardSections ?? []}
            onOpenTask={handleOpenTask}
          />
        )}

        {activeTab === 'actionplan' && presentation && result && (
          <InteractiveActionPlan
            scanId={result.scanId}
            presentation={presentation}
            initialCompletedTaskIds={result.actionPlanCompletedTaskIds ?? EMPTY_TASK_IDS}
            selectedRank={pendingTaskRank}
            onConsumeSelectedRank={() => setPendingTaskRank(null)}
            onProgressChange={(completedTaskIds) =>
              setResult((prev) =>
                prev ? { ...prev, actionPlanCompletedTaskIds: completedTaskIds } : prev,
              )
            }
          />
        )}

        {activeTab === 'competitors' &&
          (presentation?.competitors ? (
            <CompetitorServiceExplorer competitors={presentation.competitors} city={bizCity} />
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

        {activeTab === 'rankmap' && <RankMap auditData={result.auditData} />}

        {activeTab === 'keywords' && <KeywordCards auditData={result.auditData} />}

        {activeTab === 'analytics' && presentation?.ga4 && (
          <SampleAnalyticsPanel ga4={presentation.ga4} p2Score={result.p2} />
        )}

        {activeTab === 'searchconsole' && presentation?.gsc && (
          <SampleSearchConsolePanel gsc={presentation.gsc} />
        )}

        {activeTab === 'reports' && presentation?.reports && (
          <SampleReportsPanel reports={presentation.reports} />
        )}
      </div>
    </div>
  );
}
