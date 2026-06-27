import type { EvidenceTier, SignalEvidenceRow } from '@growthpath/shared';

const TIER_COLORS: Record<EvidenceTier, string> = {
  leading: '#16a34a',
  competitive: '#2563eb',
  needs_work: '#d97706',
  critical: '#dc2626',
  unknown: '#64748b',
};

interface SignalBenchmarkTableProps {
  signals: SignalEvidenceRow[];
  benchmarkSummary?: string;
}

export function SignalBenchmarkTable({ signals, benchmarkSummary }: SignalBenchmarkTableProps) {
  if (signals.length === 0) return null;

  return (
    <div className="signal-benchmark">
      {benchmarkSummary && <p className="signal-benchmark__summary">{benchmarkSummary}</p>}
      <div className="signal-benchmark__table" role="table" aria-label="Signal benchmarks">
        <div className="signal-benchmark__row signal-benchmark__row--header" role="row">
          <span role="columnheader">Signal</span>
          <span role="columnheader">Your value</span>
          <span role="columnheader">Target</span>
          <span role="columnheader">Points</span>
        </div>
        {signals.map((signal) => (
          <div key={signal.signalId} className="signal-benchmark__row" role="row">
            <span className="signal-benchmark__label" role="cell">
              {signal.label}
            </span>
            <span className="signal-benchmark__client" role="cell">
              {signal.clientValue}
            </span>
            <span className="signal-benchmark__target" role="cell">
              {signal.targetLabel}
              <span
                className="signal-tier-badge"
                style={{ color: TIER_COLORS[signal.targetTier] }}
              >
                {signal.targetTier.replace(/_/g, ' ')}
              </span>
            </span>
            <span
              className="signal-benchmark__points"
              role="cell"
              style={{ color: TIER_COLORS[signal.targetTier] }}
            >
              {signal.earned} / {signal.max}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
