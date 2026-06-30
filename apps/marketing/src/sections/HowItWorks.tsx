import './HowItWorks.css';

const steps = [
  {
    number: '01',
    title: 'Run a scan',
    description:
      'Enter a business name and location. GrowthPath pulls data from Google, citations, reviews, and competitor profiles automatically.',
  },
  {
    number: '02',
    title: 'Review your score',
    description:
      'Get a composite score with pillar breakdowns, citation gaps, competitor comparisons, and rank heatmaps — all in one dashboard.',
  },
  {
    number: '03',
    title: 'Execute the plan',
    description:
      'Follow prioritized action items ranked by impact and effort. Track completion and re-scan to measure progress over time.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section section-dark how-it-works">
      <div className="container">
        <div className="how-header">
          <p className="eyebrow">How It Works</p>
          <h2 className="section-title">From scan to strategy in three steps</h2>
          <p className="section-subtitle">
            No spreadsheets, no guesswork. GrowthPath automates the research so
            you can focus on execution.
          </p>
        </div>
        <div className="how-steps">
          {steps.map((step, i) => (
            <article key={step.number} className="how-step">
              <div className="how-step-number">{step.number}</div>
              {i < steps.length - 1 && (
                <div className="how-step-connector" aria-hidden="true" />
              )}
              <h3 className="how-step-title">{step.title}</h3>
              <p className="how-step-text">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
