import type { Scores } from '@growthpath/shared';

interface ScoreHeaderProps {
  scores: Scores;
  shareable?: boolean;
}

export function ScoreHeader({ scores, shareable = false }: ScoreHeaderProps) {
  if (shareable) {
    return (
      <div className="shareable-report__score-grid" aria-label="Score summary">
        <div className="shareable-report__score-box">
          <span className="shareable-report__score-label">Growth Profile</span>
          <span className="shareable-report__score-value shareable-report__score-value--profile">
            {scores.profile}
          </span>
        </div>
        <div className="shareable-report__score-box">
          <span className="shareable-report__score-label">P1 — Local Visibility</span>
          <span
            className="shareable-report__score-value shareable-report__score-value--p1"
            style={{ color: scores.p1_tier[1] }}
          >
            {scores.p1}
          </span>
          <span className="shareable-report__score-tier" style={{ color: scores.p1_tier[1] }}>
            {scores.p1_tier[0]}
          </span>
        </div>
        <div className="shareable-report__score-box">
          <span className="shareable-report__score-label">P2 — Digital Experience</span>
          <span
            className="shareable-report__score-value shareable-report__score-value--p2"
            style={{ color: scores.p2_tier[1] }}
          >
            {scores.p2}
          </span>
          <span className="shareable-report__score-tier" style={{ color: scores.p2_tier[1] }}>
            {scores.p2_tier[0]}
          </span>
        </div>
      </div>
    );
  }

  return (
    <header className="score-header card report-card">
      <div className="score-header__profile">
        <p className="muted">Growth profile</p>
        <h2>{scores.profile}</h2>
      </div>
      <div className="score-header__pillars">
        <div className="pillar-score">
          <span className="pillar-label">P1 — Local Visibility</span>
          <span className="pillar-value" style={{ color: scores.p1_tier[1] }}>
            {scores.p1}
          </span>
          <span className="tier-badge" style={{ backgroundColor: scores.p1_tier[1] }}>
            {scores.p1_tier[0]}
          </span>
        </div>
        <div className="pillar-score">
          <span className="pillar-label">P2 — Digital Experience</span>
          <span className="pillar-value" style={{ color: scores.p2_tier[1] }}>
            {scores.p2}
          </span>
          <span className="tier-badge" style={{ backgroundColor: scores.p2_tier[1] }}>
            {scores.p2_tier[0]}
          </span>
        </div>
      </div>
    </header>
  );
}
