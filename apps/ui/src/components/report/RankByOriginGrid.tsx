import type { OriginRow, SurfaceFilter } from '../../lib/rankmap.js';
import { formatRank, rankBand, rankColor } from '../../lib/rankmap.js';

interface RankByOriginGridProps {
  rows: OriginRow[];
  surface: SurfaceFilter;
}

function RankChip({ pos }: { pos: number | null }) {
  const band = rankBand(pos);
  return (
    <span className={`rank-chip rank-chip-${band}`} style={{ borderColor: rankColor(pos) }}>
      {formatRank(pos)}
    </span>
  );
}

export function RankByOriginGrid({ rows, surface }: RankByOriginGridProps) {
  if (rows.length === 0) {
    return <p className="muted">No origin data for this keyword.</p>;
  }

  const showMaps = surface === 'maps' || surface === 'both';
  const showLf = surface === 'lf' || surface === 'both';

  return (
    <div className="table-wrap">
      <table className="data-table rank-grid-table">
        <thead>
          <tr>
            <th>Origin</th>
            <th>Distance</th>
            {showMaps && <th>Maps</th>}
            {showLf && <th>Local Finder</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>{row.name}</td>
              <td>{row.distMi.toFixed(2)} mi</td>
              {showMaps && (
                <td>
                  <RankChip pos={row.mapsPos} />
                </td>
              )}
              {showLf && (
                <td>
                  <RankChip pos={row.lfPos} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
