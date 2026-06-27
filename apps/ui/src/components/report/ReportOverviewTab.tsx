import type { CategoryReportEvidence, ScoreCategories, Scores } from '@growthpath/shared';
import { CategoryCard } from './CategoryCard.js';
import { ClientReportAppendix } from './ClientReportAppendix.js';
import { PriorityActions } from './PriorityActions.js';
import { ReportAppendixPanel } from './ReportAppendixPanel.js';
import { ScoreExplanationStrip } from './ScoreExplanationStrip.js';

const CATEGORY_KEYS: Array<keyof ScoreCategories> = [
  'gbp_strength',
  'mappack',
  'onpage',
  'trust',
  'performance',
  'conversion',
  'ux',
];

const P1_CATEGORY_KEYS: Array<keyof ScoreCategories> = [
  'gbp_strength',
  'mappack',
  'onpage',
  'trust',
];

const P2_CATEGORY_KEYS: Array<keyof ScoreCategories> = ['performance', 'conversion', 'ux'];

interface ReportOverviewTabProps {
  scores: Scores;
  /** Client shareable mode — hides operator-only appendix diagnostics. */
  shareable?: boolean;
}

function renderCategoryCards(
  keys: Array<keyof ScoreCategories>,
  scores: Scores,
  evidenceByCategory: Map<string, CategoryReportEvidence | undefined>,
  shareable: boolean,
) {
  return keys.map((key) => (
    <CategoryCard
      key={key}
      categoryKey={key}
      category={scores.categories[key]}
      evidence={evidenceByCategory.get(key)}
      shareable={shareable}
    />
  ));
}

export function ReportOverviewTab({ scores, shareable = false }: ReportOverviewTabProps) {
  const report = scores.report;
  const evidenceByCategory = new Map(
    (report?.categories ?? []).map((category) => [category.categoryId, category]),
  );

  return (
    <>
      {report?.explanation && (
        <ScoreExplanationStrip explanation={report.explanation} profile={scores.profile} />
      )}

      <section className={shareable ? 'shareable-report__pillar-grid' : 'report-grid'}>
        {shareable ? (
          <>
            <div className="shareable-report__pillar-group">
              <h3 className="shareable-report__pillar-title">Pillar 1 — Local Visibility</h3>
              <div className="shareable-report__category-grid">
                {renderCategoryCards(P1_CATEGORY_KEYS, scores, evidenceByCategory, shareable)}
              </div>
            </div>
            <div className="shareable-report__pillar-group">
              <h3 className="shareable-report__pillar-title">Pillar 2 — Digital Experience</h3>
              <div className="shareable-report__category-grid">
                {renderCategoryCards(P2_CATEGORY_KEYS, scores, evidenceByCategory, shareable)}
              </div>
            </div>
          </>
        ) : (
          CATEGORY_KEYS.map((key) => (
            <CategoryCard
              key={key}
              categoryKey={key}
              category={scores.categories[key]}
              evidence={evidenceByCategory.get(key)}
            />
          ))
        )}
      </section>

      <PriorityActions actions={scores.actions} />

      {report?.appendix &&
        (shareable ? (
          <ClientReportAppendix appendix={report.appendix} showRemediation={false} />
        ) : (
          <ReportAppendixPanel appendix={report.appendix} />
        ))}
    </>
  );
}
