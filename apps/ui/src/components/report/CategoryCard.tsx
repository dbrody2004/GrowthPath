import type { CategoryReportEvidence, ScoreCategories } from '@growthpath/shared';
import { SignalBenchmarkTable } from './SignalBenchmarkTable.js';

const CATEGORY_LABELS: Record<string, string> = {
  gbp_strength: 'GBP Strength',
  mappack: 'Map Pack Visibility',
  onpage: 'On-Page Relevance',
  trust: 'Domain Trust',
  performance: 'Mobile Performance',
  conversion: 'Conversion Infrastructure',
  ux: 'Mobile UX',
};

interface CategoryCardProps {
  categoryKey: keyof ScoreCategories;
  category: ScoreCategories[keyof ScoreCategories];
  evidence?: CategoryReportEvidence;
  shareable?: boolean;
}

export function CategoryCard({ categoryKey, category, evidence, shareable = false }: CategoryCardProps) {
  const cardClass = shareable
    ? 'card category-card category-card--shareable'
    : 'card category-card';

  return (
    <article className={cardClass}>
      <div className="category-card__header">
        <div>
          <h3>{CATEGORY_LABELS[categoryKey] ?? categoryKey}</h3>
          {!shareable && <p className="muted">Weight: {category.weight}</p>}
        </div>
        <div className="category-card__score">
          <span className="category-score" style={{ color: category.tier[1] }}>
            {category.score}
          </span>
          <span className="tier-badge" style={{ backgroundColor: category.tier[1] }}>
            {category.tier[0]}
          </span>
        </div>
      </div>

      {shareable && (
        <div className="category-card__score-bar" aria-hidden="true">
          <div
            className="category-card__score-bar-fill"
            style={{ width: `${category.score}%`, backgroundColor: category.tier[1] }}
          />
        </div>
      )}

      {evidence?.assessment && <p className="category-assessment">{evidence.assessment}</p>}

      {evidence && (
        <SignalBenchmarkTable
          signals={evidence.signals}
          benchmarkSummary={evidence.benchmarkSummary}
        />
      )}

      {category.findings.length > 0 && (
        <ul className="findings-list">
          {category.findings.map((finding, index) => (
            <li key={`${categoryKey}-${index}`} className={`finding finding-${finding.severity}`}>
              {finding.text}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
