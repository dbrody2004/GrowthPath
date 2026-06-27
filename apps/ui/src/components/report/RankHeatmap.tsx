import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { GeoBuildResult, GeoPoint } from '../../lib/rankmap-geo.js';
import { geoPointColor } from '../../lib/rankmap-geo.js';

interface RankHeatmapProps {
  geo: GeoBuildResult;
  height?: string;
}

export function RankHeatmap({ geo, height = '28rem' }: RankHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || geo.points.length === 0) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const bounds = L.latLngBounds([]);

    for (const point of geo.points) {
      const color = geoPointColor(point);
      const radius = point.best != null && point.best <= 3 ? 10 : point.best != null ? 8 : 6;

      L.circleMarker([point.lat, point.lng], {
        radius,
        color,
        fillColor: color,
        fillOpacity: 0.85,
        weight: 2,
      })
        .bindTooltip(
          `${point.name} · ${point.dist.toFixed(1)}mi · ${point.best != null ? `#${point.best}` : 'Not ranked'}`,
          { direction: 'top' },
        )
        .addTo(map);

      bounds.extend([point.lat, point.lng]);
    }

    if (geo.biz) {
      L.circleMarker([geo.biz.lat, geo.biz.lng], {
        radius: 9,
        color: 'var(--accent)',
        fillColor: 'var(--accent)',
        fillOpacity: 1,
        weight: 3,
      })
        .bindTooltip(geo.biz.name, { direction: 'top' })
        .addTo(map);
      bounds.extend([geo.biz.lat, geo.biz.lng]);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24] });
    } else if (geo.biz) {
      map.setView([geo.biz.lat, geo.biz.lng], 11);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [geo]);

  if (geo.points.length === 0) {
    return <p className="muted">No geographic origin data available for heatmap.</p>;
  }

  return (
    <div
      ref={containerRef}
      className="rank-heatmap"
      style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden' }}
      aria-label="Rank heatmap"
    />
  );
}

export type { GeoPoint };
