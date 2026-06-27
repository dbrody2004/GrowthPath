import type { PriorityAction } from '@growthpath/shared';

interface PriorityActionsProps {
  actions: PriorityAction[];
}

export function PriorityActions({ actions }: PriorityActionsProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <section className="card report-card">
      <h3>Priority Actions</h3>
      <ol className="actions-list">
        {actions.map((action) => (
          <li key={action.rank} className="action-item">
            <div className="action-item__header">
              <span className="action-rank">#{action.rank}</span>
              <span className={`pillar-tag pillar-${action.pillar.toLowerCase()}`}>{action.pillar}</span>
              <span className="effort-tag">{action.effort} effort</span>
              <span className="impact-tag">{action.impact} impact</span>
            </div>
            <p className="action-text">{action.action}</p>
            <p className="muted action-why">{action.why_now}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
