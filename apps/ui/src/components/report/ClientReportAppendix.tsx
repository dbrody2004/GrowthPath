import type { ReportAppendix } from '@growthpath/shared';
import { KbAppendix } from './KbAppendix.js';

const STATUS_LABELS: Record<string, string> = {
  ok: 'OK',
  partial: 'Partial',
  missing: 'Missing',
  error: 'Error',
};

interface ClientReportAppendixProps {
  appendix: ReportAppendix;
  /** When false, only collection summary is shown (remediation rendered elsewhere). */
  showRemediation?: boolean;
}

/** Client-safe appendix — collection summary only, no operator diagnostics. */
export function ClientReportAppendix({
  appendix,
  showRemediation = true,
}: ClientReportAppendixProps) {
  return (
    <section className="card report-appendix client-report-appendix">
      <h3>Data sources</h3>
      <p className="muted report-appendix__intro">
        Summary of data collected for this assessment.
      </p>
      <ul className="collection-status-list">
        {appendix.collectionStatus.map((item) => (
          <li key={item.source} className={`collection-status collection-status--${item.status}`}>
            <span className="collection-status__source">{item.source}</span>
            <span className="collection-status__badge">{STATUS_LABELS[item.status] ?? item.status}</span>
            <span className="collection-status__detail">{item.detail}</span>
          </li>
        ))}
      </ul>

      {showRemediation && appendix.remediation.length > 0 && (
        <>
          <h3 className="client-report-appendix__kb-heading">Recommended fixes</h3>
          <KbAppendix sections={appendix.remediation} />
        </>
      )}
    </section>
  );
}
