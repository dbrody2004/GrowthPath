import type { CompetitorIntel } from '@growthpath/shared';

interface CompetitorIntelPanelProps {
  competitor: CompetitorIntel;
}

/** Strip all tags except bare <strong> and <em> (no attributes). */
function allowlistHtml(raw: string): string {
  return raw.replace(/<(?!\/?(?:strong|em)>)[^>]*>/gi, '');
}

export function CompetitorIntelPanel({ competitor }: CompetitorIntelPanelProps) {
  return (
    <section className="card report-card competitor-panel">
      <div className="competitor-panel__badge">Primary benchmark</div>
      <h3>{competitor.name}</h3>
      <p className="muted">{competitor.domain}</p>

      <div className="competitor-panel__header">
        <div className="competitor-panel__stats-grid">
          <div>
            <span className="stat-label">Near-me #1 frequency</span>
            <strong>{competitor.frequency_near_me}</strong>
          </div>
          <div>
            <span className="stat-label">City #1 frequency</span>
            <strong>{competitor.frequency_city}</strong>
          </div>
          <div>
            <span className="stat-label">Visibility score</span>
            <strong>{competitor.visibility.vis_score ?? '—'}</strong>
          </div>
          <div>
            <span className="stat-label">Avg rank</span>
            <strong>{competitor.visibility.avg_rank ?? '—'}</strong>
          </div>
        </div>
        {competitor.rating != null && (
          <div className="competitor-rating">
            <span>{competitor.rating.toFixed(1)}</span>
            <span className="muted">{competitor.review_count.toLocaleString()} reviews</span>
          </div>
        )}
      </div>

      <dl className="competitor-stats">
        <div>
          <dt>Domain authority</dt>
          <dd>{competitor.da}</dd>
        </div>
        <div>
          <dt>Referring domains</dt>
          <dd>{competitor.referring_domains}</dd>
        </div>
        <div>
          <dt>GBP category</dt>
          <dd>{competitor.gbp_category || '—'}</dd>
        </div>
        <div>
          <dt>Maps / LF appearances</dt>
          <dd>
            {competitor.visibility.maps_appearances} / {competitor.visibility.lf_appearances}
          </dd>
        </div>
      </dl>

      {/* safe: allowlistHtml strips all tags except <strong>/<em> */}
      <div
        className="competitor-why"
        dangerouslySetInnerHTML={{ __html: allowlistHtml(competitor.why_winning ?? '') }}
      />
    </section>
  );
}
