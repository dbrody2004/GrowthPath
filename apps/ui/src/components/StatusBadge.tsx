import type { ScanStatus } from '@growthpath/shared';

const STATUS_LABELS: Record<ScanStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  partial: 'Partial',
  complete: 'Complete',
  failed: 'Failed',
};

interface StatusBadgeProps {
  status: ScanStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-${status}`}>{STATUS_LABELS[status]}</span>;
}
