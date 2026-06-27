import { useMemo, useState } from 'react';
import type {
  DashboardSectionPresentation,
  ScoreCategories,
  Scores,
} from '@growthpath/shared';

const CATEGORY_LABELS: Record<keyof ScoreCategories, string> = {
  gbp_strength: 'GBP Strength',
  mappack: 'Map Pack Visibility',
  onpage: 'On-Page Relevance',
  trust: 'Domain Trust',
  performance: 'Mobile Performance',
  conversion: 'Conversion Infrastructure',
  ux: 'Mobile UX',
};

const PILLAR_GROUPS: Array<{
  id: 'P1' | 'P2';
  name: string;
  categoryKeys: Array<keyof ScoreCategories>;
}> = [
  {
    id: 'P1',
    name: 'Local Visibility',
    categoryKeys: ['mappack', 'gbp_strength', 'onpage', 'trust'],
  },
  {
    id: 'P2',
    name: 'Digital Experience',
    categoryKeys: ['performance', 'conversion', 'ux'],
  },
];

function effortBadgeClass(effort: string): string {
  if (effort === 'Low') return 'portal-dashboard__badge portal-dashboard__badge--good';
  if (effort === 'Medium') return 'portal-dashboard__badge portal-dashboard__badge--warn';
  return 'portal-dashboard__badge portal-dashboard__badge--muted';
}

function impactBadgeClass(impact: string): string {
  return impact === 'High'
    ? 'portal-dashboard__badge portal-dashboard__badge--accent'
    : 'portal-dashboard__badge portal-dashboard__badge--muted';
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * score) / 100;

  return (
    <svg className="portal-dashboard__score-ring" width="58" height="58" viewBox="0 0 52 52" aria-hidden>
      <circle cx="26" cy="26" r={radius} fill="none" stroke="var(--border)" strokeWidth="5" />
      <circle
        cx="26"
        cy="26"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
      />
      <text
        x="26"
        y="31"
        textAnchor="middle"
        fontSize="12"
        fontWeight="600"
        fill="var(--text)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      >
        {score}
      </text>
    </svg>
  );
}

interface PortalDashboardExplorerProps {
  scores: Scores;
  dashboardSections: DashboardSectionPresentation[];
  onOpenTask: (rank: number) => void;
}

export function PortalDashboardExplorer({
  scores,
  dashboardSections,
  onOpenTask,
}: PortalDashboardExplorerProps) {
  const [activeCategory, setActiveCategory] = useState<keyof ScoreCategories>('mappack');

  const evidenceByCategory = useMemo(
    () => new Map((scores.report?.categories ?? []).map((category) => [category.categoryId, category])),
    [scores.report?.categories],
  );

  const sectionByCategory = useMemo(
    () => new Map(dashboardSections.map((section) => [section.categoryId, section])),
    [dashboardSections],
  );

  const category = scores.categories[activeCategory];
  const evidence = evidenceByCategory.get(activeCategory);
  const section = sectionByCategory.get(activeCategory);
  const label = CATEGORY_LABELS[activeCategory] ?? activeCategory;

  return (
    <div className="portal-dashboard">
      <aside className="portal-dashboard__rail" aria-label="Score categories">
        {PILLAR_GROUPS.map((group, groupIndex) => (
          <div key={group.id} className="portal-dashboard__pillar">
            <div className="portal-dashboard__pillar-header">
              <span className="portal-dashboard__pillar-tag">{group.id}</span>
              <span className="portal-dashboard__pillar-name">{group.name}</span>
            </div>
            <div className="portal-dashboard__pillar-rule" />
            <ul className="portal-dashboard__section-list">
              {group.categoryKeys.map((categoryKey) => {
                const item = scores.categories[categoryKey];
                const isActive = activeCategory === categoryKey;

                return (
                  <li key={categoryKey}>
                    <button
                      type="button"
                      className={
                        isActive
                          ? 'portal-dashboard__section-tile portal-dashboard__section-tile--active'
                          : 'portal-dashboard__section-tile'
                      }
                      onClick={() => setActiveCategory(categoryKey)}
                    >
                      <span className="portal-dashboard__section-tile-left">
                        <span
                          className="portal-dashboard__section-dot"
                          style={{ backgroundColor: item.tier[1] }}
                          aria-hidden
                        />
                        <span className="portal-dashboard__section-label">
                          {CATEGORY_LABELS[categoryKey]}
                        </span>
                      </span>
                      <span className="portal-dashboard__section-score">{item.score}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {groupIndex === 0 && <div className="portal-dashboard__pillar-spacer" />}
          </div>
        ))}
      </aside>

      <section className="portal-dashboard__center" aria-label="Section detail">
        <p className="portal-dashboard__eyebrow">
          {label} · section detail
        </p>
        <article className="card portal-dashboard__card">
          <div className="portal-dashboard__score-row">
            <ScoreRing score={category.score ?? 0} color={category.tier[1]} />
            <div>
              <h3 className="portal-dashboard__score-heading">
                {category.score} / 100
              </h3>
              <p className="muted portal-dashboard__score-sub">
                {label} · {category.tier[0]}
              </p>
            </div>
          </div>
          {evidence?.assessment && (
            <p className="portal-dashboard__assessment">{evidence.assessment}</p>
          )}
        </article>

        {category.findings.length > 0 && (
          <article className="card portal-dashboard__card">
            <h4 className="portal-dashboard__card-title">What we found</h4>
            <ul className="portal-dashboard__findings">
              {category.findings.map((finding, index) => (
                <li
                  key={`${activeCategory}-${index}`}
                  className={`portal-dashboard__finding finding finding-${finding.severity}`}
                >
                  {finding.text}
                </li>
              ))}
            </ul>
          </article>
        )}
      </section>

      <aside className="portal-dashboard__right" aria-label="Summary and actions">
        <p className="portal-dashboard__eyebrow">Summary &amp; actions</p>

        {section?.synopsis && (
          <article className="card portal-dashboard__card">
            <h4 className="portal-dashboard__card-title">Section summary</h4>
            <p className="portal-dashboard__synopsis">{section.synopsis}</p>
          </article>
        )}

        {section && section.actions.length > 0 && (
          <article className="card portal-dashboard__card">
            <h4 className="portal-dashboard__card-title">Action plan items for this section</h4>
            <ul className="portal-dashboard__action-list">
              {section.actions.map((action) => (
                <li key={action.rank} className="portal-dashboard__action-row">
                  <div>
                    <p className="portal-dashboard__action-name">
                      #{action.rank} · {action.name}
                    </p>
                    <div className="portal-dashboard__action-badges">
                      <span className={effortBadgeClass(action.effort)}>{action.effort} effort</span>
                      <span className={impactBadgeClass(action.impact)}>{action.impact} impact</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="portal-dashboard__action-go"
                    onClick={() => onOpenTask(action.rank)}
                    aria-label={`Open action plan item ${action.rank}`}
                  >
                    →
                  </button>
                </li>
              ))}
            </ul>
          </article>
        )}
      </aside>
    </div>
  );
}

export type { PortalDashboardExplorerProps };
