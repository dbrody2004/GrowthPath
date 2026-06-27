import type { KbRemediationSection } from '@growthpath/shared';

interface KbAppendixProps {
  sections: KbRemediationSection[];
  variant?: 'default' | 'shareable';
}

function effortClass(effort: string): string {
  return `kb-badge kb-badge--effort-${effort.toLowerCase()}`;
}

function impactClass(impact: string): string {
  return `kb-badge kb-badge--impact-${impact.toLowerCase()}`;
}

/** Priority-ordered, section-banded knowledge-base remediation cards. */
export function KbAppendix({ sections, variant = 'default' }: KbAppendixProps) {
  if (sections.length === 0) return null;

  const rootClass =
    variant === 'shareable'
      ? 'kb-appendix kb-appendix--shareable print-break-before'
      : 'kb-appendix';

  return (
    <section className={rootClass} aria-label="SEO knowledge appendix">
      <header className="kb-appendix__header">
        <p className="kb-appendix__eyebrow">SEO Knowledge Appendix</p>
        <h3>Why these gaps exist — and how to fix them</h3>
        <p className="kb-appendix__intro">
          The findings in this report are driven by measurable gaps across your GBP, on-page signals,
          domain trust, mobile performance, and conversion infrastructure. Sections are ordered by
          ranking influence — start at the top.
        </p>
      </header>

      {sections.map((section) => (
        <div key={section.id} className="kb-section">
          <div className="kb-section__band">
            <div className="kb-section__band-accent" />
            <div className="kb-section__band-body">
              <div className="kb-section__band-left">
                <span className="kb-section__number">{section.number}</span>
                <span className="kb-section__title">{section.title}</span>
                <span className="kb-section__narrative">{section.narrative}</span>
              </div>
              <div className="kb-section__stat">
                <div className="kb-section__stat-num">{section.stat}</div>
                <div className="kb-section__stat-label">{section.statLabel}</div>
              </div>
            </div>
          </div>

          {section.entries.map((entry, index) => (
            <article key={entry.key} className="kb-card">
              <header className="kb-card__header">
                <div className="kb-card__left">
                  <div className="kb-card__priority">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <div className="kb-card__title">{entry.title}</div>
                    <div className="kb-card__key">{entry.key}</div>
                  </div>
                </div>
                <div className="kb-card__badges">
                  <span className={effortClass(entry.effort)}>{entry.effort} Effort</span>
                  <span className={impactClass(entry.impact)}>{entry.impact} Impact</span>
                </div>
              </header>
              <div className="kb-card__body">
                <div className="kb-block">
                  <span className="kb-block__label">Why It Matters</span>
                  <p>{entry.why}</p>
                </div>
                <div className="kb-block">
                  <span className="kb-block__label">How Google Measures It</span>
                  <p>{entry.howGoogle}</p>
                </div>
                <div className="kb-block">
                  <span className="kb-block__label">How to Fix It</span>
                  <ul className="kb-fix-steps">
                    {entry.fixSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      ))}
    </section>
  );
}
