import type { CompetitorLeaderboardRow } from '@growthpath/shared';

interface CompetitorLeaderboardProps {
  rows: CompetitorLeaderboardRow[];
  emptyMessage?: string;
}

export function CompetitorLeaderboard({
  rows,
  emptyMessage = 'No aggregated competitor data for this scan.',
}: CompetitorLeaderboardProps) {
  if (rows.length === 0) {
    return (
      <section className="card report-card">
        <h3>Competitor leaderboard</h3>
        <p className="muted">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="card report-card">
      <h3>Competitor leaderboard</h3>
      <p className="muted">
        Aggregated visibility across Maps and Local Finder. Client and primary competitor rows are
        highlighted.
      </p>
      <div className="table-wrap">
        <table className="data-table leaderboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Business</th>
              <th>Vis score</th>
              <th>Maps / LF</th>
              <th>NM / City #1</th>
              <th>Avg rank</th>
              <th>Rating</th>
              <th>Reviews</th>
              <th>DA</th>
              <th>RDs</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => {
              const rowClass = [
                entry.is_client ? 'leaderboard-client-row' : '',
                entry.is_primary ? 'leaderboard-primary-row' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <tr key={entry.domain} className={rowClass || undefined}>
                  <td>{entry.rank}</td>
                  <td>
                    <strong>{entry.name}</strong>
                    <div className="muted">{entry.domain}</div>
                    {entry.is_client && <span className="row-tag row-tag--client">You</span>}
                    {entry.is_primary && <span className="row-tag row-tag--primary">Primary</span>}
                  </td>
                  <td>{entry.vis_score.toFixed(1)}</td>
                  <td>
                    {entry.maps_appearances} / {entry.lf_appearances}
                  </td>
                  <td>
                    {entry.frequency_near_me} / {entry.frequency_city}
                  </td>
                  <td>{entry.avg_rank.toFixed(1)}</td>
                  <td>{entry.rating?.toFixed(1) ?? '—'}</td>
                  <td>{entry.review_count?.toLocaleString() ?? '—'}</td>
                  <td>{entry.da ?? '—'}</td>
                  <td>{entry.referring_domains ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
