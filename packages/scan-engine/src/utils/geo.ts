export function haversineMi(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dlat = ((lat2 - lat1) * Math.PI) / 180;
  const dlng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dlng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SECTOR_NAMES = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dlng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dlng) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dlng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function sectorOf(bearing: number): string {
  return SECTOR_NAMES[Math.floor(((bearing + 22.5) % 360) / 45)];
}

export function quadrantOf(bearing: number): string {
  return ['NE', 'SE', 'SW', 'NW'][Math.floor(bearing / 90) % 4];
}

export function angDist(a: number, b: number): number {
  return Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
}

export function viewportRadiusMiles(zoom: number, lat = 47.5): number {
  const worldWidthPx = 256 * 2 ** zoom;
  const metersPerPx = (40_075_016.7 * Math.cos((lat * Math.PI) / 180)) / worldWidthPx;
  return ((1280 * metersPerPx) / 2) / 1609.34;
}

export function zoomForOrigin(distMi: number, lat = 47.5): string {
  for (let z = 14; z >= 10; z -= 1) {
    if (viewportRadiusMiles(z, lat) >= distMi) {
      return `${z}z`;
    }
  }
  return '11z';
}

export function cleanDomain(domain: string): string {
  return domain
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .toLowerCase();
}
