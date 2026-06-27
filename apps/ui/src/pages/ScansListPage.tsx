import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { listScans, type ScanListEntry } from '../lib/scans.js';

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export function ScansListPage() {
  const [scans, setScans] = useState<ScanListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listScans()
      .then((data) => {
        if (!cancelled) setScans(data);
      })
      .catch((fetchError) => {
        if (!cancelled)
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to load scans');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="card table-card">
      <div className="page-header">
        <div>
          <h2>Scans</h2>
          <p className="muted">Recent audit runs and their status.</p>
        </div>
        <Link to="/scans/new" className="btn-primary">
          <Icon name="add" size={18} />
          New scan
        </Link>
      </div>

      {loading && <p className="muted">Loading scans…</p>}
      {error && <p className="form-error">{error}</p>}

      {!loading && !error && scans.length === 0 && (
        <p className="muted">No scans yet. Use New scan above to get started.</p>
      )}

      {!loading && scans.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Status</th>
                <th>P1</th>
                <th>P2</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan.id}>
                  <td>
                    <Link to={`/scans/${encodeURIComponent(scan.id)}`}>{scan.bizName}</Link>
                  </td>
                  <td>
                    <StatusBadge status={scan.status} />
                  </td>
                  <td>{scan.p1 ?? '—'}</td>
                  <td>{scan.p2 ?? '—'}</td>
                  <td>{formatDate(scan.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
