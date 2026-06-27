import { useEffect, useMemo, useState } from 'react';
import type { CompetitorExplorerPresentation } from '@growthpath/shared';
import { rankBand, RANK_COLORS } from '../../lib/rankmap.js';

type CompMode = 'near_me' | 'city';

interface CompetitorServiceExplorerProps {
  competitors: CompetitorExplorerPresentation;
  city?: string;
}

function rankCellClass(pos: number | null): string {
  const band = rankBand(pos);
  return `comp-explorer__rank comp-explorer__rank--${band}`;
}

function formatRankLabel(pos: number | null): string {
  if (pos == null) return '—';
  return `#${pos}`;
}

export function CompetitorServiceExplorer({ competitors, city }: CompetitorServiceExplorerProps) {
  const services = competitors.services;
  const [activeService, setActiveService] = useState(services[0]?.service ?? '');
  const [mode, setMode] = useState<CompMode>('near_me');

  useEffect(() => {
    if (!services.some((service) => service.service === activeService)) {
      setActiveService(services[0]?.service ?? '');
    }
  }, [services, activeService]);

  const surface = useMemo(() => {
    const svc = services.find((s) => s.service === activeService);
    if (!svc) return null;
    return mode === 'near_me' ? svc.nearMe : svc.city;
  }, [services, activeService, mode]);

  if (services.length === 0) {
    return <p className="muted">No competitor explorer data available.</p>;
  }

  const client = competitors.client;

  return (
    <div className="comp-explorer">
      <aside className="comp-explorer__rail" aria-label="Services">
        <p className="portal-dashboard__eyebrow">Your services</p>
        <ul className="comp-explorer__service-list">
          {services.map((svc) => (
            <li key={svc.service}>
              <button
                type="button"
                className={
                  activeService === svc.service
                    ? 'comp-explorer__service-btn comp-explorer__service-btn--active'
                    : 'comp-explorer__service-btn'
                }
                onClick={() => setActiveService(svc.service)}
              >
                {svc.service}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="comp-explorer__center" aria-label="Rank by origin">
        <div className="comp-explorer__mode-toggle">
          <button
            type="button"
            className={mode === 'near_me' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setMode('near_me')}
          >
            Near me
          </button>
          <button
            type="button"
            className={mode === 'city' ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setMode('city')}
          >
            City modifier
          </button>
        </div>

        {surface && (
          <>
            <p className="portal-dashboard__eyebrow">
              {activeService} · your rank by location
            </p>
            <div className="card comp-explorer__table-wrap">
              <table className="data-table comp-explorer__table">
                <thead>
                  <tr>
                    <th>Origin</th>
                    <th>Maps</th>
                    <th>Local Finder</th>
                  </tr>
                </thead>
                <tbody>
                  {surface.origins.map((origin) => (
                    <tr key={origin.name}>
                      <td>{origin.name}</td>
                      <td>
                        <span className={rankCellClass(origin.maps)} style={{ color: RANK_COLORS[rankBand(origin.maps)] }}>
                          {formatRankLabel(origin.maps)}
                        </span>
                      </td>
                      <td>
                        <span className={rankCellClass(origin.lf)} style={{ color: RANK_COLORS[rankBand(origin.lf)] }}>
                          {formatRankLabel(origin.lf)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="comp-explorer__summary">
              <div className="comp-explorer__summary-cell">
                <span className="comp-explorer__summary-label">Avg rank</span>
                <span className="comp-explorer__summary-value">
                  {surface.clientAvg != null ? `#${surface.clientAvg}` : 'Not ranked'}
                </span>
              </div>
              <div className="comp-explorer__summary-cell">
                <span className="comp-explorer__summary-label">Appearances</span>
                <span className="comp-explorer__summary-value">
                  {surface.clientApp} / {surface.origins.length * 2}
                </span>
              </div>
            </div>

            <div className="comp-explorer__insight card">
              <h4 className="portal-dashboard__card-title">What this means</h4>
              <p>{surface.insight}</p>
            </div>
          </>
        )}
      </section>

      <aside className="comp-explorer__right" aria-label="Competitor cards">
        <p className="portal-dashboard__eyebrow">Top competitors · {activeService}</p>

        <article className="card comp-explorer__comp-card comp-explorer__comp-card--you">
          <div className="comp-explorer__comp-header">
            <div>
              <strong>{client.name}</strong>
              <span className="comp-explorer__you-pill">You</span>
              <p className="muted">{client.domain}</p>
            </div>
          </div>
          <div className="comp-explorer__comp-metrics">
            <div>
              <span className="comp-explorer__metric-label">DA</span>
              <span className="comp-explorer__metric-value">{client.da}</span>
            </div>
            <div>
              <span className="comp-explorer__metric-label">Reviews</span>
              <span className="comp-explorer__metric-value">{client.reviews}</span>
            </div>
            {surface && (
              <div>
                <span className="comp-explorer__metric-label">Appearances</span>
                <span className="comp-explorer__metric-value">
                  {surface.clientApp} / {surface.origins.length * 2}
                </span>
              </div>
            )}
          </div>
        </article>

        {surface?.comps.map((comp) => {
          const totalApp = comp.mapsApp + comp.lfApp;
          const maxApp = (surface.origins.length * 2) || 10;
          const daColor =
            comp.da != null && comp.da > client.da + 5
              ? 'var(--danger)'
              : comp.da != null && comp.da <= client.da + 2
                ? 'var(--success)'
                : 'var(--warn)';

          return (
            <article key={comp.domain} className="card comp-explorer__comp-card">
              <div className="comp-explorer__comp-header">
                <div>
                  <strong>{comp.name}</strong>
                  <p className="muted">{comp.domain}</p>
                </div>
                <span className="comp-explorer__rank-badge">#{comp.rank}</span>
              </div>
              <div className="comp-explorer__comp-metrics">
                <div>
                  <span className="comp-explorer__metric-label">DA</span>
                  <span className="comp-explorer__metric-value" style={{ color: daColor }}>
                    {comp.da ?? '—'}
                  </span>
                </div>
                <div>
                  <span className="comp-explorer__metric-label">Reviews</span>
                  <span className="comp-explorer__metric-value">
                    {comp.reviews?.toLocaleString() ?? '—'}
                  </span>
                  {comp.rating != null && (
                    <span className="muted">{comp.rating}★</span>
                  )}
                </div>
                <div>
                  <span className="comp-explorer__metric-label">Appearances</span>
                  <span className="comp-explorer__metric-value">
                    {totalApp} / {maxApp}
                  </span>
                  <div className="comp-explorer__appear-bar">
                    <div style={{ width: `${Math.round((totalApp / maxApp) * 100)}%` }} />
                  </div>
                </div>
              </div>
              <div className="comp-explorer__comp-links">
                <a href={`https://${comp.domain}`} target="_blank" rel="noreferrer">
                  Website
                </a>
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(`${comp.name}${city ? ` ${city}` : ''}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  GBP
                </a>
              </div>
            </article>
          );
        })}
      </aside>
    </div>
  );
}
