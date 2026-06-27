import type { ScoreExplanation } from '@growthpath/shared';

interface ScoreExplanationStripProps {
  explanation: ScoreExplanation;
  profile: string;
}

export function ScoreExplanationStrip({ explanation, profile }: ScoreExplanationStripProps) {
  return (
    <section className="card score-explanation">
      <div className="score-explanation__header">
        <h3>Score explanation</h3>
        <p className="muted">{profile}</p>
      </div>
      <p className="score-explanation__profile">{explanation.profileRationale}</p>
      <div className="score-explanation__pillars">
        <div>
          <span className="pillar-label">P1 breakdown</span>
          <p>{explanation.p1Summary}</p>
        </div>
        <div>
          <span className="pillar-label">P2 breakdown</span>
          <p>{explanation.p2Summary}</p>
        </div>
      </div>
    </section>
  );
}
