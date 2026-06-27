import type { AuditData, Scores } from '@growthpath/shared';
import { CompetitorComparison } from './CompetitorComparison.js';
import { CompetitorIntelPanel } from './CompetitorIntelPanel.js';
import { CompetitorLeaderboard } from './CompetitorLeaderboard.js';
import { KbAppendix } from './KbAppendix.js';
import { KeywordCards } from './KeywordCards.js';
import { RankMap } from './RankMap.js';
import { ReportOverviewTab } from './ReportOverviewTab.js';
import { ScoreHeader } from './ScoreHeader.js';

interface ShareableReportDocumentProps {
  result: {
    auditData: AuditData;
    scores: Scores;
  };
  businessName?: string;
  scanDate?: string;
}

/** Full client-shareable report — all sections visible for print/PDF (no tabs). */
export function ShareableReportDocument({
  result,
  businessName,
  scanDate,
}: ShareableReportDocumentProps) {
  const title = businessName ?? result.auditData.business ?? 'GrowthPath Report';
  const remediation = result.scores.report?.appendix?.remediation ?? [];

  return (
    <article className="shareable-report">
      <header className="shareable-report__cover">
        <p className="shareable-report__eyebrow">Growth Gap Analysis</p>
        <h1 className="shareable-report__title">{title}</h1>
        {scanDate && <p className="shareable-report__date">Assessment date: {scanDate}</p>}
        <ScoreHeader scores={result.scores} shareable />
      </header>

      <section className="shareable-report__section">
        <h2 className="shareable-report__section-title">Overview</h2>
        <ReportOverviewTab scores={result.scores} shareable />
      </section>

      <section className="shareable-report__section print-break-before">
        <h2 className="shareable-report__section-title">Rank map</h2>
        <RankMap auditData={result.auditData} />
      </section>

      <section className="shareable-report__section print-break-before">
        <h2 className="shareable-report__section-title">Competitors</h2>
        <CompetitorLeaderboard rows={result.scores.competitor_leaderboard ?? []} />
        {result.scores.competitor_intel && (
          <>
            <CompetitorIntelPanel competitor={result.scores.competitor_intel} />
            <CompetitorComparison competitor={result.scores.competitor_intel} />
          </>
        )}
      </section>

      <section className="shareable-report__section print-break-before">
        <h2 className="shareable-report__section-title">Keywords</h2>
        <KeywordCards auditData={result.auditData} />
      </section>

      {remediation.length > 0 && (
        <section className="shareable-report__section">
          <KbAppendix sections={remediation} variant="shareable" />
        </section>
      )}

      <footer className="shareable-report__footer">
        <p>GrowthPath Local Visibility Report</p>
        <p className="shareable-report__footer-meta">
          Confidential — prepared for {title}
          {scanDate ? ` · ${scanDate}` : ''}
        </p>
      </footer>
    </article>
  );
}
