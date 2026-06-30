import './Problem.css';

const painPoints = [
  {
    id: 'competitors',
    title: 'Blind to competitor moves',
    description:
      'You know rivals rank above you, but not which keywords, citations, or reviews are driving their advantage.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
        <line x1="4" y1="4" x2="20" y2="20" />
      </svg>
    ),
    accent: 'blue',
  },
  {
    id: 'scattered',
    title: 'Scattered audit data',
    description:
      'GBP, citations, reviews, and rankings live in separate tools — making it hard to see what actually matters.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    accent: 'green',
  },
  {
    id: 'priorities',
    title: 'No clear priorities',
    description:
      'Generic SEO checklists bury the highest-impact fixes under low-value tasks that waste your time and budget.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
        <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
        <path d="M4 17v2" />
        <path d="M2 19h4" />
      </svg>
    ),
    accent: 'blue',
  },
];

export function Problem() {
  return (
    <section className="section section-light problem">
      <div className="container">
        <div className="problem-header">
          <p className="eyebrow">The Challenge</p>
          <h2 className="section-title">
            Local SEO is a battlefield — most businesses fight blind
          </h2>
          <p className="section-subtitle">
            Without structured intelligence, you&apos;re guessing at fixes while
            competitors compound their lead. GrowthPath turns scattered signals
            into a clear competitive picture.
          </p>
        </div>
        <div className="problem-grid">
          {painPoints.map((point) => (
            <article key={point.id} className="problem-card">
              <div className={`problem-icon problem-icon--${point.accent}`} aria-hidden="true">
                {point.icon}
              </div>
              <h3 className="problem-card-title">{point.title}</h3>
              <p className="problem-card-text">{point.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
