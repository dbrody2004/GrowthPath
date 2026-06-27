import type { Ga4SamplePresentation } from '@growthpath/shared';

interface SampleAnalyticsPanelProps {
  ga4: Ga4SamplePresentation;
  p2Score: number;
}

export function SampleAnalyticsPanel({ ga4, p2Score }: SampleAnalyticsPanelProps) {
  return (
    <section className="card report-card sample-analytics-panel">
      <div className="sample-panel-header">
        <div>
          <h3>Google Analytics 4 — Traffic &amp; Conversion</h3>
          <p className="muted">{ga4.periodLabel} · Sample data</p>
        </div>
        <span className="sample-badge">Sample data</span>
      </div>

      <div className="sample-metrics-grid">
        <div className="sample-metric">
          <div className="sample-metric-label">Total sessions</div>
          <div className="sample-metric-value">{ga4.totalSessions.toLocaleString()}</div>
        </div>
        <div className="sample-metric">
          <div className="sample-metric-label">Engaged sessions</div>
          <div className="sample-metric-value">{ga4.engagedSessions.toLocaleString()}</div>
          <div className="sample-metric-sub">Engagement rate: {ga4.engagementRate}%</div>
        </div>
        <div className="sample-metric">
          <div className="sample-metric-label">Conversions tracked</div>
          <div className="sample-metric-value sample-metric-critical">{ga4.conversionsTracked}</div>
        </div>
      </div>

      <div className="sample-callout sample-callout-info">
        <strong>P2 Score Confirmed — GA4 supports scan assessment ({p2Score}/100)</strong>
        <p>{ga4.p2ConfirmationText}</p>
      </div>

      <div className="sample-two-col">
        <div>
          <h4>Traffic by channel</h4>
          <ul className="sample-channel-list">
            {ga4.channels.map((channel) => (
              <li key={channel.name}>
                <span>{channel.name}</span>
                <span>{channel.sessions.toLocaleString()}</span>
                <span>{channel.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Top pages by sessions</h4>
          <ul className="sample-page-list">
            {ga4.topPages.map((page) => (
              <li key={page.path}>
                <span>{page.path}</span>
                <span>{page.sessions.toLocaleString()}</span>
                <span>{page.bounceRate}% bounce</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="sample-action-items">
        <h4>GA4 action items</h4>
        {ga4.actionItems.map((item) => (
          <div key={item.text} className={`sample-action-item sample-action-${item.severity}`}>
            <span className="sample-action-severity">{item.severity}</span>
            <p>{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
