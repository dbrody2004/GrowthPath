import type { CollectionOutcomeStatus, SourceCollectionResult } from '@growthpath/shared';

const STATUS_CLASS: Record<CollectionOutcomeStatus, string> = {
  ok: 'collection-status-ok',
  partial: 'collection-status-partial',
  missing: 'collection-status-missing',
  error: 'collection-status-error',
  skipped: 'collection-status-skipped',
};

interface ScanCollectionStatusPanelProps {
  sources: SourceCollectionResult[];
  partialReasons?: string[];
  showOperatorDetail?: boolean;
}

export function ScanCollectionStatusPanel({
  sources,
  partialReasons = [],
  showOperatorDetail = true,
}: ScanCollectionStatusPanelProps) {
  if (sources.length === 0 && partialReasons.length === 0) {
    return null;
  }

  return (
    <section className="card report-card collection-status-panel" aria-label="Data collection status">
      <h3>Data collection</h3>

      {partialReasons.length > 0 && (
        <div className="banner banner-warning collection-status-summary">
          <p>
            <strong>Partial result.</strong> Some data could not be collected:
          </p>
          <ul>
            {partialReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {sources.length > 0 && (
        <table className="collection-status-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Status</th>
              <th>Detail</th>
              {showOperatorDetail && <th>Operator</th>}
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.sourceId}>
                <td>{source.label}</td>
                <td>
                  <span className={`collection-status-badge ${STATUS_CLASS[source.status]}`}>
                    {source.status}
                  </span>
                </td>
                <td>{source.detail}</td>
                {showOperatorDetail && (
                  <td className="muted">{source.operatorDetail ?? '—'}</td>
                )}
                <td className="muted">
                  {source.durationMs != null ? `${source.durationMs}ms` : '—'}
                  {source.retryCount ? ` · ${source.retryCount} retries` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
