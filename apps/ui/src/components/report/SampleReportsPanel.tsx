import type { ReportCatalogItem } from '@growthpath/shared';

interface SampleReportsPanelProps {
  reports: ReportCatalogItem[];
}

export function SampleReportsPanel({ reports }: SampleReportsPanelProps) {
  return (
    <section className="card report-card sample-reports-panel">
      <div className="sample-panel-header">
        <div>
          <h3>Reports &amp; Exports</h3>
          <p className="muted">Downloadable deliverables from the portal prototype (sample metadata).</p>
        </div>
        <span className="sample-badge">Sample data</span>
      </div>

      <div className="sample-reports-grid">
        {reports.map((report) => (
          <article key={report.title} className="sample-report-card">
            <h4>{report.title}</h4>
            <p className="muted">{report.description}</p>
            <p className="sample-report-meta">{report.meta}</p>
            <button type="button" className="btn-secondary" disabled>
              Download {report.format.toUpperCase()}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
