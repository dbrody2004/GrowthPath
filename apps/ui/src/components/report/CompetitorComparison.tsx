import type { CompetitorIntel } from '@growthpath/shared';

interface CompetitorComparisonProps {
  competitor: CompetitorIntel;
}

export function CompetitorComparison({ competitor }: CompetitorComparisonProps) {
  return (
    <section className="card report-card competitor-comparison">
      <h3>Client vs primary competitor</h3>
      <p className="muted">
        Side-by-side benchmarks for {competitor.client.name} and {competitor.name}.
      </p>

      {competitor.action_callout && (
        <div className="competitor-callout">
          <span className="competitor-callout__label">Top counter-move</span>
          <p>{competitor.action_callout}</p>
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table gap-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>You</th>
              <th>{competitor.name}</th>
              <th>Gap</th>
            </tr>
          </thead>
          <tbody>
            {competitor.deltas.map((delta) => (
              <tr key={delta.metric} className={`gap-row gap-row--${delta.advantage}`}>
                <td>{delta.label}</td>
                <td>{delta.formattedClient}</td>
                <td>{delta.formattedCompetitor}</td>
                <td>{delta.formattedDelta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {competitor.why_factors.length > 0 && (
        <div className="why-factors">
          <h4>Why they win</h4>
          <ul>
            {competitor.why_factors.map((factor) => (
              <li key={factor}>{factor}</li>
            ))}
          </ul>
        </div>
      )}

      {competitor.surface_matrix.length > 0 && (
        <div className="surface-matrix">
          <h4>Rank surface matrix</h4>
          <p className="muted">Best scanned position by service and surface (lower is better).</p>
          <div className="table-wrap">
            <table className="data-table surface-matrix-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>You · Maps NM</th>
                  <th>Them · Maps NM</th>
                  <th>You · LF NM</th>
                  <th>Them · LF NM</th>
                  <th>You · Maps City</th>
                  <th>Them · Maps City</th>
                </tr>
              </thead>
              <tbody>
                {competitor.surface_matrix.map((row) => (
                  <tr key={row.service}>
                    <td>{row.service}</td>
                    <td>{formatPos(row.client_maps_nm)}</td>
                    <td>{formatPos(row.maps_nm)}</td>
                    <td>{formatPos(row.client_lf_nm)}</td>
                    <td>{formatPos(row.lf_nm)}</td>
                    <td>{formatPos(row.client_maps_city)}</td>
                    <td>{formatPos(row.maps_city)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {competitor.counter_moves.length > 0 && (
        <div className="counter-moves">
          <h4>Recommended counter-moves</h4>
          <ol className="counter-moves-list">
            {competitor.counter_moves.map((move) => (
              <li key={move.rank}>
                <div className="counter-move__header">
                  <strong>{move.action}</strong>
                  <span className="counter-move__meta">
                    {move.pillar} · {move.surface}
                  </span>
                </div>
                <p className="muted">{move.rationale}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function formatPos(pos: number | null): string {
  if (pos == null || pos > 20) return '—';
  return `#${pos}`;
}
