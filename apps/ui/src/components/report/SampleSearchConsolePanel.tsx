import type { GscSamplePresentation } from '@growthpath/shared';

interface SampleSearchConsolePanelProps {
  gsc: GscSamplePresentation;
}

export function SampleSearchConsolePanel({ gsc }: SampleSearchConsolePanelProps) {
  return (
    <section className="card report-card sample-gsc-panel">
      <div className="sample-panel-header">
        <div>
          <h3>Google Search Console — Keyword Strategy</h3>
          <p className="muted">{gsc.periodLabel} · Organic web rankings only — not Map Pack</p>
        </div>
        <span className="sample-badge">Sample data</span>
      </div>

      <div className="sample-metrics-grid">
        <div className="sample-metric">
          <div className="sample-metric-label">Total clicks</div>
          <div className="sample-metric-value">{gsc.totalClicks.toLocaleString()}</div>
        </div>
        <div className="sample-metric">
          <div className="sample-metric-label">Total impressions</div>
          <div className="sample-metric-value">{gsc.totalImpressions.toLocaleString()}</div>
        </div>
        <div className="sample-metric">
          <div className="sample-metric-label">Avg CTR</div>
          <div className="sample-metric-value">{gsc.avgCtr}%</div>
        </div>
        <div className="sample-metric">
          <div className="sample-metric-label">Avg position</div>
          <div className="sample-metric-value">{gsc.avgPosition}</div>
        </div>
      </div>

      <h4>Keyword opportunities</h4>
      <div className="sample-kw-grid">
        {gsc.keywordOpportunities.map((kw) => (
          <article key={kw.query} className="sample-kw-card">
            <div className="sample-kw-header">
              <strong>{kw.query}</strong>
              <span className="sample-kw-tier">{kw.tier}</span>
            </div>
            <dl className="sample-kw-metrics">
              <div><dt>Impressions</dt><dd>{kw.impressions.toLocaleString()}</dd></div>
              <div><dt>Clicks</dt><dd>{kw.clicks.toLocaleString()}</dd></div>
              <div><dt>CTR</dt><dd>{kw.ctr}%</dd></div>
              <div><dt>Avg position</dt><dd>{kw.avgPosition}</dd></div>
            </dl>
            <p className="muted">{kw.rationale}</p>
          </article>
        ))}
      </div>

      <div className="sample-two-col">
        <div>
          <h4>Top queries by impressions</h4>
          <ul className="sample-bar-list">
            {gsc.topQueries.map((row) => (
              <li key={row.query}>
                <span>{row.query}</span>
                <span>{row.impressions.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Keyword clusters</h4>
          <ul className="sample-cluster-list">
            {gsc.clusters.map((cluster) => (
              <li key={cluster.name}>
                <div className="sample-cluster-header">
                  <strong>{cluster.name}</strong>
                  <span>{cluster.tier}</span>
                </div>
                <div className="sample-cluster-bar">
                  <div style={{ width: `${cluster.barWidthPct}%` }} />
                </div>
                <span className="muted">
                  {cluster.clicks} clicks · pos {cluster.avgPosition} · CTR {cluster.ctr}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="sample-note">
        GSC shows organic web rankings, not Map Pack. These are separate Google systems.
      </p>
    </section>
  );
}
