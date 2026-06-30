import './Features.css';

const features = [
  {
    id: 'scoring',
    badge: 'Scoring Engine',
    title: '40+ signals, one composite score',
    description:
      'Every scan produces pillar scores across visibility, reputation, citations, and on-page health — weighted by what actually moves local rankings.',
    metric: '87',
    metricLabel: 'Sample score',
    bars: [92, 78, 65, 84],
    barLabels: ['Visibility', 'Reputation', 'Citations', 'On-Page'],
    accent: 'green',
  },
  {
    id: 'citations',
    badge: 'Citation Gap Finder',
    title: 'Find directories you\'re missing',
    description:
      'Compare your NAP presence against top competitors across 50+ directories. See exactly where gaps cost you trust and rankings.',
    metric: '23',
    metricLabel: 'Gaps found',
    bars: [100, 72, 45, 88, 60],
    barLabels: ['Yelp', 'BBB', 'Healthgrades', 'Avvo', 'Chamber'],
    accent: 'blue',
  },
  {
    id: 'competitors',
    badge: 'Competitor Intel',
    title: 'Spy on who\'s beating you',
    description:
      'Side-by-side competitor profiles with keyword overlap, review velocity, and GBP completeness — so you know where to strike.',
    metric: '12',
    metricLabel: 'Competitors tracked',
    bars: [95, 88, 76, 71, 68, 62],
    barLabels: ['Comp A', 'Comp B', 'Comp C', 'Comp D', 'Comp E', 'You'],
    accent: 'blue',
  },
  {
    id: 'actions',
    badge: 'Action Plans',
    title: 'Prioritized fixes, not checklists',
    description:
      'Rules engine turns findings into ranked tasks with effort estimates. Work the highest-impact items first and track progress over time.',
    metric: '34',
    metricLabel: 'Tasks queued',
    bars: [100, 85, 70, 55, 40],
    barLabels: ['Critical', 'High', 'Medium', 'Low', 'Info'],
    accent: 'green',
  },
  {
    id: 'heatmaps',
    badge: 'Rank Heatmaps',
    title: 'See rankings by geography',
    description:
      'Grid-based rank maps show how you perform across your service area — revealing neighborhoods where competitors dominate.',
    metric: '#4.2',
    metricLabel: 'Avg. map pack rank',
    bars: [88, 72, 55, 40, 28, 15],
    barLabels: ['0.5mi', '1mi', '2mi', '3mi', '5mi', '10mi'],
    accent: 'blue',
  },
];

export function Features() {
  return (
    <section id="features" className="section section-light features">
      <div className="container">
        <div className="features-header">
          <p className="eyebrow">Platform</p>
          <h2 className="section-title">
            Everything you need to dominate local search
          </h2>
          <p className="section-subtitle">
            From automated scans to prioritized action plans — GrowthPath gives
            agencies and local brands the intelligence layer they&apos;ve
            been missing.
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature) => (
            <article
              key={feature.id}
              className={`feature-card feature-card--${feature.accent}`}
            >
              <div className="feature-card-content">
                <span className="feature-badge">{feature.badge}</span>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
              <div className="feature-viz" aria-hidden="true">
                <div className="feature-metric">
                  <span className="feature-metric-value">{feature.metric}</span>
                  <span className="feature-metric-label">{feature.metricLabel}</span>
                </div>
                <div className="feature-bars">
                  {feature.bars.map((width, i) => (
                    <div key={feature.barLabels[i]} className="feature-bar-row">
                      <span className="feature-bar-label">{feature.barLabels[i]}</span>
                      <div className="feature-bar-track">
                        <div
                          className="feature-bar-fill"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
