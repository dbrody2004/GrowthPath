import { useEffect, useMemo, useState } from 'react';
import type { AuditData } from '@growthpath/shared';
import { buildGeoPoints, type GeoKeywordType } from '../../lib/rankmap-geo.js';
import {
  keywordFor,
  keywordStats,
  originRows,
  proximityWall,
  servicesFromKeywords,
  type SurfaceFilter,
} from '../../lib/rankmap.js';
import { DistanceDecayPlot } from './DistanceDecayPlot.js';
import { RankByOriginGrid } from './RankByOriginGrid.js';
import { RankHeatmap } from './RankHeatmap.js';
import { RankSummaryStrip } from './RankSummaryStrip.js';

type RankViewMode = 'grid' | 'heatmap' | 'decay';

interface RankMapProps {
  auditData: AuditData;
}

export function RankMap({ auditData }: RankMapProps) {
  const services = useMemo(() => {
    const fromKeywords = servicesFromKeywords(auditData.keywords);
    const fromPresentation = auditData.presentation?.rankMap?.services ?? [];
    const merged = new Set([...fromKeywords, ...fromPresentation]);
    return [...merged];
  }, [auditData.keywords, auditData.presentation?.rankMap?.services]);

  const [service, setService] = useState(services[0] ?? '');
  const [keywordType, setKeywordType] = useState<GeoKeywordType>('near_me');
  const [surface, setSurface] = useState<SurfaceFilter>('both');
  const [viewMode, setViewMode] = useState<RankViewMode>('grid');
  const [showLearn, setShowLearn] = useState(false);

  useEffect(() => {
    if (services.length > 0 && !services.includes(service)) {
      setService(services[0]);
    }
  }, [services, service]);

  const keywordNearMe = keywordFor(auditData.keywords, service, 'near_me');
  const keywordCity = keywordFor(auditData.keywords, service, 'city');

  const rows = useMemo(() => {
    if (keywordType === 'both') {
      const nearMeRows = keywordNearMe
        ? originRows(auditData.serp, auditData.local_finder, keywordNearMe)
        : [];
      const cityRows = keywordCity
        ? originRows(auditData.serp, auditData.local_finder, keywordCity)
        : [];
      return [...nearMeRows, ...cityRows].sort((a, b) => a.distMi - b.distMi);
    }

    const keyword =
      keywordType === 'near_me' ? keywordNearMe : keywordCity;
    return keyword ? originRows(auditData.serp, auditData.local_finder, keyword) : [];
  }, [auditData.serp, auditData.local_finder, keywordType, keywordNearMe, keywordCity]);

  const summaryKeyword =
    keywordType === 'both'
      ? keywordNearMe || keywordCity
        ? 'Both intents'
        : null
      : keywordType === 'near_me'
        ? keywordNearMe
        : keywordCity;

  const stats = keywordStats(rows, surface);
  const wall = proximityWall(rows, surface);

  const geo = useMemo(
    () =>
      buildGeoPoints({
        auditData,
        service,
        keywordType,
        surface,
      }),
    [auditData, service, keywordType, surface],
  );

  const hasHeatmap = geo.points.length > 0;

  useEffect(() => {
    if (viewMode === 'heatmap' && !hasHeatmap) {
      setViewMode('grid');
    }
  }, [viewMode, hasHeatmap]);

  if (services.length === 0) {
    return <p className="muted">No keyword data available for rank map.</p>;
  }

  return (
    <section className="card report-card rank-map-panel">
      <h3>Rank Map</h3>
      <p className="muted">
        Your rank by origin across the trade-area grid. Toggle service, intent, and surface to explore
        visibility.
      </p>

      <div className="rank-map-controls">
        <label className="rank-control">
          <span>Service</span>
          <select value={service} onChange={(e) => setService(e.target.value)}>
            {services.map((svc) => (
              <option key={svc} value={svc}>
                {svc}
              </option>
            ))}
          </select>
        </label>

        <div className="rank-control">
          <span>Keyword type</span>
          <div className="toggle-group">
            <button
              type="button"
              className={keywordType === 'near_me' ? 'toggle-btn active' : 'toggle-btn'}
              onClick={() => setKeywordType('near_me')}
            >
              Near me
            </button>
            <button
              type="button"
              className={keywordType === 'city' ? 'toggle-btn active' : 'toggle-btn'}
              onClick={() => setKeywordType('city')}
            >
              City modifier
            </button>
            <button
              type="button"
              className={keywordType === 'both' ? 'toggle-btn active' : 'toggle-btn'}
              onClick={() => setKeywordType('both')}
            >
              Both
            </button>
          </div>
        </div>

        <div className="rank-control">
          <span>Surface</span>
          <div className="toggle-group">
            <button
              type="button"
              className={surface === 'maps' ? 'toggle-btn active' : 'toggle-btn'}
              onClick={() => setSurface('maps')}
            >
              Maps
            </button>
            <button
              type="button"
              className={surface === 'lf' ? 'toggle-btn active' : 'toggle-btn'}
              onClick={() => setSurface('lf')}
            >
              Local Finder
            </button>
            <button
              type="button"
              className={surface === 'both' ? 'toggle-btn active' : 'toggle-btn'}
              onClick={() => setSurface('both')}
            >
              Both
            </button>
          </div>
        </div>

        <div className="rank-control">
          <span>View</span>
          <div className="toggle-group">
            <button
              type="button"
              className={viewMode === 'grid' ? 'toggle-btn active' : 'toggle-btn'}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            {hasHeatmap && (
              <button
                type="button"
                className={viewMode === 'heatmap' ? 'toggle-btn active' : 'toggle-btn'}
                onClick={() => setViewMode('heatmap')}
              >
                Heatmap
              </button>
            )}
            <button
              type="button"
              className={viewMode === 'decay' ? 'toggle-btn active' : 'toggle-btn'}
              onClick={() => setViewMode('decay')}
            >
              Decay plot
            </button>
          </div>
        </div>
      </div>

      <div className="rank-map-learn-toggle">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowLearn((v) => !v)}
        >
          {showLearn ? 'Hide guide' : 'What this means'}
        </button>
      </div>

      {showLearn && (
        <div className="rank-map-learn card">
          <h4>Maps vs. Local Finder</h4>
          <p>
            <strong>Google Maps</strong> — the pinned pack results. Proximity-driven. Your location is
            the dominant ranking signal.
          </p>
          <p>
            <strong>Local Finder</strong> — the expanded list. Content signals, DA, and GBP completeness
            matter more here. The same business can rank very differently across the two.
          </p>
          <h4>Near me vs. City modifier</h4>
          <p>
            <strong>Near me</strong> queries reflect proximity intent — being close matters most.
          </p>
          <p>
            <strong>City modifier</strong> queries reflect destination intent — authority signals matter
            more than distance.
          </p>
          <h4>The proximity wall</h4>
          <p>
            Rankings often collapse at a geographic boundary. Breaking through requires GBP signals,
            review velocity, and content depth.
            {wall != null && (
              <>
                {' '}
                <strong>Proximity wall detected at ~{wall.toFixed(1)} mi.</strong>
              </>
            )}
          </p>
        </div>
      )}

      {(rows.length > 0 || hasHeatmap) && (
        <>
          {summaryKeyword && (
            <RankSummaryStrip
              service={service}
              keyword={summaryKeyword}
              stats={stats}
              wallDetected={wall != null}
            />
          )}

          <div className="rank-map-legend">
            <span className="legend-item">
              <span className="legend-dot legend-top3" /> Top 3
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-lf" /> Rank 4–10
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-deep" /> Rank 11–20
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-none" /> Not ranked
            </span>
          </div>

          {viewMode === 'grid' && rows.length > 0 && (
            <>
              <h4 className="rank-section-title">Your rank by origin</h4>
              <RankByOriginGrid rows={rows} surface={surface} />
            </>
          )}

          {viewMode === 'heatmap' && hasHeatmap && <RankHeatmap geo={geo} />}

          {viewMode === 'decay' && rows.length > 0 && (
            <>
              <h4 className="rank-section-title">Distance decay</h4>
              <DistanceDecayPlot rows={rows} surface={surface} />
            </>
          )}
        </>
      )}
    </section>
  );
}
