import type { KeywordStats } from '../../lib/rankmap.js';

interface RankSummaryStripProps {
  service: string;
  keyword: string;
  stats: KeywordStats;
  wallDetected: boolean;
}

export function RankSummaryStrip({ service, keyword, stats, wallDetected }: RankSummaryStripProps) {
  return (
    <div className="rank-summary-strip">
      <div className="rank-summary-item">
        <span className="rank-summary-label">Service</span>
        <span className="rank-summary-value">{service}</span>
      </div>
      <div className="rank-summary-item">
        <span className="rank-summary-label">Keyword</span>
        <span className="rank-summary-value">{keyword}</span>
      </div>
      <div className="rank-summary-item">
        <span className="rank-summary-label">Top 3 appearances</span>
        <span className="rank-summary-value">{stats.top3Appearances}</span>
      </div>
      <div className="rank-summary-item">
        <span className="rank-summary-label">Avg rank</span>
        <span className="rank-summary-value">{stats.avgRank ?? '—'}</span>
      </div>
      <div className="rank-summary-item">
        <span className="rank-summary-label">Not ranked</span>
        <span className="rank-summary-value">{stats.notRanked}</span>
      </div>
      {wallDetected && <span className="wall-badge">Proximity wall detected</span>}
    </div>
  );
}
