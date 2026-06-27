import type { PortalPresentation } from '@growthpath/shared';

interface PortalActionPlanProps {
  presentation: PortalPresentation;
}

export function PortalActionPlan({ presentation }: PortalActionPlanProps) {
  if (presentation.tasks.length === 0) {
    return null;
  }

  return (
    <section className="card report-card portal-action-plan">
      <h3>Action Plan</h3>
      <p className="muted">
        Priority fixes ranked by impact. Steps extracted from the Kitchen 747 portal prototype.
      </p>
      <ol className="portal-task-list">
        {presentation.tasks.map((task) => (
          <li key={task.id} className="portal-task-item">
            <div className="portal-task-header">
              <span className="action-rank">#{task.rank}</span>
              <span className={`pillar-tag pillar-${task.pillar.toLowerCase()}`}>{task.pillar}</span>
              <span className="effort-tag">{task.effort} effort</span>
              <span className="impact-tag">{task.impact} impact</span>
            </div>
            <h4 className="portal-task-title">{task.name}</h4>
            <p className="muted portal-task-why">{task.why}</p>
            {task.steps.length > 0 && (
              <ol className="portal-task-steps">
                {task.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
