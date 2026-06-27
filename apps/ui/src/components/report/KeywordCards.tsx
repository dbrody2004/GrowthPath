import type { AuditData } from '@growthpath/shared';
import { bestPosition, formatRank, originRows } from '../../lib/rankmap.js';

interface KeywordCardsProps {
  auditData: AuditData;
}

function visibilityLabel(best: number | null): string {
  if (best == null) return 'Invisible';
  if (best <= 3) return 'In 3-pack';
  if (best <= 10) return 'Local Finder visible';
  return 'Deep results only';
}

export function KeywordCards({ auditData }: KeywordCardsProps) {
  if (auditData.keywords.length === 0) {
    return <p className="muted">No keywords in this scan.</p>;
  }

  return (
    <section className="keyword-cards-grid">
      {auditData.keywords.map((entry) => {
        const rows = originRows(auditData.serp, auditData.local_finder, entry.keyword);
        const mapsPositions = rows.map((r) => r.mapsPos);
        const lfPositions = rows.map((r) => r.lfPos);
        const bestMaps = bestPosition(mapsPositions);
        const bestLf = bestPosition(lfPositions);
        const bestOverall = bestPosition([bestMaps, bestLf]);

        return (
          <article key={entry.keyword} className="card keyword-card">
            <div className="keyword-card__header">
              <h3>{entry.keyword}</h3>
              <span className={`keyword-type-badge keyword-type-${entry.type}`}>
                {entry.type === 'near_me' ? 'Near me' : 'City modifier'}
              </span>
            </div>
            <p className="muted">Service: {entry.service}</p>
            <dl className="keyword-stats">
              <div>
                <dt>Best Maps</dt>
                <dd>{formatRank(bestMaps)}</dd>
              </div>
              <div>
                <dt>Best Local Finder</dt>
                <dd>{formatRank(bestLf)}</dd>
              </div>
              <div>
                <dt>Visibility</dt>
                <dd>{visibilityLabel(bestOverall)}</dd>
              </div>
              <div>
                <dt>Origins scanned</dt>
                <dd>{rows.length}</dd>
              </div>
            </dl>
          </article>
        );
      })}
    </section>
  );
}
