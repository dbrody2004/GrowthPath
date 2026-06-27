import type { ReportAppendix } from '@growthpath/shared';
import { KbAppendix } from './KbAppendix.js';

const STATUS_LABELS: Record<string, string> = {
  ok: 'OK',
  partial: 'Partial',
  missing: 'Missing',
  error: 'Error',
};

interface ReportAppendixPanelProps {
  appendix: ReportAppendix;
}

export function ReportAppendixPanel({ appendix }: ReportAppendixPanelProps) {
  return (
    <section className="card report-appendix">
      <h3>Diagnostics appendix</h3>
      <p className="muted report-appendix__intro">
        Collection status, signal availability, and rule triggers for operator trust.
      </p>

      {appendix.notes.length > 0 && (
        <ul className="appendix-notes">
          {appendix.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}

      <div className="appendix-grid">
        <div>
          <h4>Data collection</h4>
          <ul className="collection-status-list">
            {appendix.collectionStatus.map((item) => (
              <li key={item.source} className={`collection-status collection-status--${item.status}`}>
                <span className="collection-status__source">{item.source}</span>
                <span className="collection-status__badge">{STATUS_LABELS[item.status] ?? item.status}</span>
                <span className="collection-status__detail">{item.detail}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>Signal availability</h4>
          <ul className="signal-availability-list">
            {Object.entries(appendix.signalAvailability).map(([categoryId, availability]) => (
              <li key={categoryId}>
                <code>{categoryId}</code>
                <span className={`availability-badge availability-badge--${availability}`}>
                  {availability}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {appendix.triggeredKbKeys.length > 0 && (
        <div className="appendix-kb-keys">
          <h4>Triggered knowledge-base keys</h4>
          <div className="kb-key-tags">
            {appendix.triggeredKbKeys.map((key) => (
              <span key={key} className="kb-key-tag">
                {key}
              </span>
            ))}
          </div>
        </div>
      )}

      {appendix.remediation.length > 0 && (
        <KbAppendix sections={appendix.remediation} />
      )}
    </section>
  );
}
