import { extractPsiMetrics } from '../services/pagespeed.js';

export interface GeocodeResult {
  lat: number;
  lng: number;
  county: string | null;
  homeZcta: string | null;
}

export interface PlacesCandidate {
  id?: string;
  displayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  types?: string[];
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  regularOpeningHours?: unknown;
  websiteUri?: string;
}

export interface GoogleClient {
  geocode(address: string): Promise<GeocodeResult>;
  reverseGeocode(lat: number, lng: number): Promise<string>;
  searchPlaces(textQuery: string): Promise<PlacesCandidate[]>;
  getPlaceCid(placeId: string): Promise<string | null>;
  runPageSpeed(url: string, strategy: 'desktop' | 'mobile', category?: string): Promise<unknown>;
  extractPageSpeed(data: unknown): ReturnType<typeof extractPsiMetrics>;
}

export function createGoogleClient(apiKey: string, fetchFn: typeof fetch = fetch): GoogleClient {
  return {
    async geocode(address: string): Promise<GeocodeResult> {
      const r = await fetchFn(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`,
      );
      const geo = (await r.json()) as {
        results?: Array<{
          geometry: { location: { lat: number; lng: number } };
          address_components?: Array<{ long_name: string; types: string[] }>;
        }>;
        status?: string;
      };
      if (!geo.results?.length) {
        throw new Error(`Geocoding failed for '${address}': ${geo.status ?? 'no results'}`);
      }
      const result = geo.results[0];
      let county: string | null = null;
      let homeZcta: string | null = null;
      for (const comp of result.address_components ?? []) {
        if (comp.types.includes('administrative_area_level_2')) {
          county = comp.long_name.replace(/ County$/i, '');
        }
        if (comp.types.includes('postal_code')) homeZcta = comp.long_name;
      }
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        county,
        homeZcta,
      };
    },

    async reverseGeocode(lat: number, lng: number): Promise<string> {
      const r = await fetchFn(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`,
      );
      const data = (await r.json()) as {
        results?: Array<{
          address_components?: Array<{ long_name: string; types: string[] }>;
        }>;
      };
      for (const res of data.results ?? []) {
        for (const comp of res.address_components ?? []) {
          const types = comp.types;
          if (
            types.some((t) =>
              ['neighborhood', 'sublocality_level_1', 'sublocality', 'locality'].includes(t),
            )
          ) {
            return comp.long_name;
          }
        }
      }
      return `${lat},${lng}`;
    },

    async searchPlaces(textQuery: string): Promise<PlacesCandidate[]> {
      const r = await fetchFn('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': [
            'places.id',
            'places.displayName',
            'places.rating',
            'places.userRatingCount',
            'places.primaryType',
            'places.types',
            'places.formattedAddress',
            'places.nationalPhoneNumber',
            'places.regularOpeningHours',
            'places.websiteUri',
          ].join(','),
        },
        body: JSON.stringify({ textQuery }),
      });
      const data = (await r.json()) as { places?: PlacesCandidate[] };
      return data.places ?? [];
    },

    async getPlaceCid(placeId: string): Promise<string | null> {
      const r = await fetchFn(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=url&key=${apiKey}`,
      );
      const data = (await r.json()) as { result?: { url?: string } };
      const url = data.result?.url ?? '';
      if (url.includes('cid=')) {
        return url.split('cid=')[1]?.split('&')[0] ?? null;
      }
      return null;
    },

    async runPageSpeed(url: string, strategy: 'desktop' | 'mobile', category?: string): Promise<unknown> {
      const params = new URLSearchParams({ url, key: apiKey, strategy });
      if (category) params.set('category', category);
      const r = await fetchFn(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`);
      return r.json();
    },

    extractPageSpeed(data: unknown) {
      return extractPsiMetrics(data);
    },
  };
}
