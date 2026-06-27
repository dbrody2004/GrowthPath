import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PortalPresentation, PortalTaskPresentation } from '@growthpath/shared';
import { updateActionPlanProgress } from '../../lib/scans.js';

function legacyStorageKey(seedKey: string): string {
  return `gp.actionplan.${seedKey}`;
}

function readLegacyCompletedIds(seedKey: string): Set<number> {
  try {
    const raw = localStorage.getItem(legacyStorageKey(seedKey));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is number => typeof id === 'number'));
  } catch {
    return new Set();
  }
}

function clearLegacyCompletedIds(seedKey: string): void {
  try {
    localStorage.removeItem(legacyStorageKey(seedKey));
  } catch {
    // ignore storage errors
  }
}

function priorityLabel(task: PortalTaskPresentation): 'Quick Win' | 'Critical' | 'Important' {
  if (task.effort === 'Low' && task.impact === 'High') return 'Quick Win';
  if (task.impact === 'High') return 'Critical';
  return 'Important';
}

function priorityClass(label: ReturnType<typeof priorityLabel>): string {
  if (label === 'Quick Win') return 'action-plan__priority action-plan__priority--quick';
  if (label === 'Critical') return 'action-plan__priority action-plan__priority--critical';
  return 'action-plan__priority action-plan__priority--important';
}

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

interface InteractiveActionPlanProps {
  scanId: string;
  presentation: PortalPresentation;
  initialCompletedTaskIds?: number[];
  selectedRank?: number | null;
  onConsumeSelectedRank?: () => void;
  onProgressChange?: (completedTaskIds: number[]) => void;
}

export function InteractiveActionPlan({
  scanId,
  presentation,
  initialCompletedTaskIds = [],
  selectedRank,
  onConsumeSelectedRank,
  onProgressChange,
}: InteractiveActionPlanProps) {
  const { tasks, seedKey } = presentation;
  const [completedIds, setCompletedIds] = useState<Set<number>>(
    () => new Set(initialCompletedTaskIds),
  );
  const [activeTaskId, setActiveTaskId] = useState<number | null>(tasks[0]?.id ?? null);
  const [showCompleted, setShowCompleted] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const migratedLegacyRef = useRef(false);
  const saveGenerationRef = useRef(0);

  useEffect(() => {
    setCompletedIds(new Set(initialCompletedTaskIds));
  }, [initialCompletedTaskIds]);

  useEffect(() => {
    if (migratedLegacyRef.current) return;
    if (initialCompletedTaskIds.length > 0) return;

    const legacyIds = readLegacyCompletedIds(seedKey);
    if (legacyIds.size === 0) {
      migratedLegacyRef.current = true;
      return;
    }

    migratedLegacyRef.current = true;
    const legacyList = [...legacyIds];
    setCompletedIds(legacyIds);

    void updateActionPlanProgress(scanId, legacyList)
      .then(({ actionPlanCompletedTaskIds }) => {
        clearLegacyCompletedIds(seedKey);
        const migrated = new Set(actionPlanCompletedTaskIds);
        setCompletedIds(migrated);
        onProgressChange?.(actionPlanCompletedTaskIds);
      })
      .catch(() => {
        setSaveError('Could not migrate saved progress. Changes may not persist.');
      });
  }, [initialCompletedTaskIds.length, onProgressChange, scanId, seedKey]);

  const openTasks = useMemo(() => tasks.filter((t) => !completedIds.has(t.id)), [tasks, completedIds]);
  const doneTasks = useMemo(() => tasks.filter((t) => completedIds.has(t.id)), [tasks, completedIds]);

  const counts = useMemo(() => {
    let critical = 0;
    let important = 0;
    let quickWin = 0;
    for (const task of openTasks) {
      const label = priorityLabel(task);
      if (label === 'Quick Win') quickWin += 1;
      else if (label === 'Critical') critical += 1;
      else important += 1;
    }
    return { critical, important, quickWin };
  }, [openTasks]);

  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;

  const toggleComplete = useCallback(
    (taskId: number, complete: boolean) => {
      const generation = ++saveGenerationRef.current;
      let snapshot: Set<number> = new Set();
      let nextIds: number[] = [];
      setCompletedIds((prev) => {
        snapshot = new Set(prev);
        const next = new Set(prev);
        if (complete) next.add(taskId);
        else next.delete(taskId);
        nextIds = [...next];
        return next;
      });
      if (complete) {
        setActiveTaskId(null);
      }

      setSaveError(null);
      void updateActionPlanProgress(scanId, nextIds)
        .then(({ actionPlanCompletedTaskIds }) => {
          if (generation !== saveGenerationRef.current) return;
          clearLegacyCompletedIds(seedKey);
          setCompletedIds(new Set(actionPlanCompletedTaskIds));
          onProgressChange?.(actionPlanCompletedTaskIds);
        })
        .catch(() => {
          if (generation !== saveGenerationRef.current) return;
          setCompletedIds(snapshot);
          setSaveError('Could not save progress. Please try again.');
        });
    },
    [onProgressChange, scanId, seedKey],
  );

  useEffect(() => {
    if (selectedRank == null) return;
    const match = tasks.find((t) => t.rank === selectedRank);
    if (match) {
      setActiveTaskId(match.id);
      requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
    onConsumeSelectedRank?.();
  }, [selectedRank, tasks, onConsumeSelectedRank]);

  if (tasks.length === 0) return null;

  const progressPct = Math.round((completedIds.size / tasks.length) * 100);

  return (
    <section className="action-plan card report-card">
      <div className="action-plan__progress">
        <div className="action-plan__progress-top">
          <span className="action-plan__progress-title">Action plan</span>
          <span className="action-plan__progress-count">
            {completedIds.size} of {tasks.length} complete
          </span>
        </div>
        <div className="action-plan__progress-bar-bg">
          <div className="action-plan__progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="action-plan__progress-sub">
          <span>{counts.critical} critical</span>
          <span>{counts.important} important</span>
          <span>{counts.quickWin} quick win</span>
        </div>
        {saveError && <p className="action-plan__save-error">{saveError}</p>}
      </div>

      <div className="action-plan__body">
        <aside className="action-plan__list" aria-label="Task list">
          <p className="portal-dashboard__eyebrow">Priority order · engine-ranked</p>
          <ul className="action-plan__task-list">
            {openTasks.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  className={
                    activeTaskId === task.id
                      ? 'action-plan__task-row action-plan__task-row--active'
                      : 'action-plan__task-row'
                  }
                  onClick={() => setActiveTaskId(task.id)}
                >
                  <span
                    className="action-plan__task-check"
                    role="checkbox"
                    aria-checked={false}
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleComplete(task.id, true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleComplete(task.id, true);
                      }
                    }}
                  />
                  <span className="action-plan__task-meta">
                    <span className="action-plan__task-top">
                      <span className="action-rank">#{task.rank}</span>
                      <span className={`pillar-tag pillar-${task.pillar.toLowerCase()}`}>
                        {task.pillar}
                      </span>
                    </span>
                    <span className="action-plan__task-name">{task.name}</span>
                    <span className="action-plan__task-badges">
                      <span className={effortBadgeClass(task.effort)}>{task.effort} effort</span>
                      <span className={impactBadgeClass(task.impact)}>{task.impact} impact</span>
                      <span className={priorityClass(priorityLabel(task))}>
                        {priorityLabel(task)}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {doneTasks.length > 0 && (
            <>
              <button
                type="button"
                className="action-plan__done-toggle"
                onClick={() => setShowCompleted((v) => !v)}
              >
                Completed · {doneTasks.length} ({showCompleted ? 'Hide' : 'Show'})
              </button>
              {showCompleted &&
                doneTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    className="action-plan__task-row action-plan__task-row--done"
                    onClick={() => setActiveTaskId(task.id)}
                  >
                    <span
                      className="action-plan__task-check action-plan__task-check--done"
                      role="checkbox"
                      aria-checked
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleComplete(task.id, false);
                      }}
                    />
                    <span className="action-plan__task-name">{task.name}</span>
                  </button>
                ))}
            </>
          )}
        </aside>

        <div className="action-plan__detail" ref={detailRef}>
          {!activeTask && (
            <p className="muted action-plan__empty">
              Select a task to see what to do and why it matters.
            </p>
          )}

          {activeTask && (
            <>
              <div className="action-plan__detail-header">
                <div className="action-plan__detail-rank-row">
                  <span
                    className={
                      completedIds.has(activeTask.id)
                        ? 'action-plan__detail-rank action-plan__detail-rank--done'
                        : 'action-plan__detail-rank'
                    }
                  >
                    {completedIds.has(activeTask.id) ? '✓' : activeTask.rank}
                  </span>
                  <span className={`pillar-tag pillar-${activeTask.pillar.toLowerCase()}`}>
                    {activeTask.pillar}
                  </span>
                </div>
                <h3>{activeTask.name}</h3>
                <div className="action-plan__detail-badges">
                  <span className={effortBadgeClass(activeTask.effort)}>{activeTask.effort}</span>
                  <span className={impactBadgeClass(activeTask.impact)}>{activeTask.impact}</span>
                  <span className={priorityClass(priorityLabel(activeTask))}>
                    {priorityLabel(activeTask)}
                  </span>
                </div>
                <p className="portal-dashboard__eyebrow">Why this matters now</p>
                <p className="action-plan__why">{activeTask.why}</p>
              </div>

              <button
                type="button"
                className={
                  completedIds.has(activeTask.id)
                    ? 'btn-secondary action-plan__complete-btn'
                    : 'btn-primary action-plan__complete-btn'
                }
                onClick={() =>
                  toggleComplete(activeTask.id, !completedIds.has(activeTask.id))
                }
              >
                {completedIds.has(activeTask.id) ? 'Undo — mark incomplete' : 'Mark as complete'}
              </button>

              {activeTask.steps.length > 0 && (
                <div className="action-plan__steps card">
                  <h4 className="portal-dashboard__card-title">How to do it</h4>
                  <ol className="action-plan__steps-list">
                    {activeTask.steps.map((step, index) => (
                      <li key={step}>
                        <span className="action-plan__step-num">{index + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
