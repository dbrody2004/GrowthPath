import type { OriginRow, SurfaceFilter } from '../../lib/rankmap.js';
import { proximityWall, rankBand, rankColor } from '../../lib/rankmap.js';

interface DistanceDecayPlotProps {
  rows: OriginRow[];
  surface: SurfaceFilter;
}

const WIDTH = 560;
const HEIGHT = 280;
const PAD = { top: 24, right: 24, bottom: 40, left: 48 };

function getPos(row: OriginRow, surface: SurfaceFilter): number | null {
  if (surface === 'maps') return row.mapsPos;
  if (surface === 'lf') return row.lfPos;
  const positions = [row.mapsPos, row.lfPos].filter((p): p is number => p != null && p <= 20);
  if (positions.length === 0) return null;
  return Math.min(...positions);
}

export function DistanceDecayPlot({ rows, surface }: DistanceDecayPlotProps) {
  if (rows.length === 0) {
    return <p className="muted">No data for decay plot.</p>;
  }

  const maxDist = Math.max(...rows.map((r) => r.distMi), 1);
  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const wall = proximityWall(rows, surface);

  const xScale = (dist: number) => PAD.left + (dist / maxDist) * plotW;
  const yScale = (pos: number | null) => {
    if (pos == null || pos > 20) return PAD.top + plotH;
    return PAD.top + ((pos - 1) / 19) * plotH;
  };

  return (
    <div className="decay-plot-frame">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="decay-plot" role="img" aria-label="Distance decay plot">
        {[1, 5, 10, 15, 20].map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={PAD.left + plotW}
              y1={yScale(tick)}
              y2={yScale(tick)}
              className="decay-grid-line"
            />
            <text x={PAD.left - 8} y={yScale(tick) + 4} className="decay-axis-label" textAnchor="end">
              #{tick}
            </text>
          </g>
        ))}

        {wall != null && (
          <line
            x1={xScale(wall)}
            x2={xScale(wall)}
            y1={PAD.top}
            y2={PAD.top + plotH}
            className="decay-wall-line"
          />
        )}

        {rows.map((row) => {
          const pos = getPos(row, surface);
          const cx = xScale(row.distMi);
          const cy = yScale(pos);
          const band = rankBand(pos);
          return (
            <circle
              key={row.key}
              cx={cx}
              cy={cy}
              r={6}
              fill={rankColor(pos)}
              className={`decay-point decay-point-${band}`}
            >
              <title>
                {row.name}: {pos != null && pos <= 20 ? `#${pos}` : 'Not ranked'} at {row.distMi.toFixed(2)} mi
              </title>
            </circle>
          );
        })}

        <text x={PAD.left + plotW / 2} y={HEIGHT - 8} className="decay-axis-title" textAnchor="middle">
          Distance from business (mi)
        </text>
        <text
          x={14}
          y={PAD.top + plotH / 2}
          className="decay-axis-title"
          textAnchor="middle"
          transform={`rotate(-90 14 ${PAD.top + plotH / 2})`}
        >
          Rank (lower is better)
        </text>
      </svg>
      {wall != null && (
        <p className="decay-wall-caption muted">
          Proximity wall detected at ~{wall.toFixed(1)} mi — rankings drop beyond this distance.
        </p>
      )}
    </div>
  );
}
