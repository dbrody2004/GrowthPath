import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import type { GazetteerRecord } from '../types.js';

const GAZETTEER_URL =
  'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_zcta_national.zip';

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CACHE_DIR = join(PACKAGE_ROOT, 'data', 'gazetteer');
const CACHE_FILE = join(CACHE_DIR, '2023_gaz_zcta_national.json');

export interface CensusClient {
  loadGazetteer(): Promise<GazetteerRecord[]>;
  fetchAcsPopulation(zctas: string[]): Promise<Record<string, number>>;
}

function parseGazetteerZip(buffer: Buffer): GazetteerRecord[] {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const txtEntry = entries.find((e: { entryName: string }) => e.entryName.endsWith('.txt'));
  if (!txtEntry) {
    throw new Error('Gazetteer zip missing .txt file');
  }
  const lines = zip.readAsText(txtEntry).split(/\r?\n/);
  const header = lines[0].split('\t').map((h: string) => h.trim());
  const records: GazetteerRecord[] = [];
  for (const line of lines.slice(1)) {
    const parts = line.split('\t');
    if (parts.length < header.length) continue;
    const row: Record<string, string> = {};
    header.forEach((h: string, i: number) => {
      row[h] = parts[i]?.trim() ?? '';
    });
    try {
      records.push({
        zcta: row.GEOID,
        lat: parseFloat(row.INTPTLAT),
        lng: parseFloat(row.INTPTLONG),
      });
    } catch {
      // skip malformed rows
    }
  }
  return records;
}

export function createCensusClient(apiKey: string, fetchFn: typeof fetch = fetch): CensusClient {
  return {
    async loadGazetteer(): Promise<GazetteerRecord[]> {
      try {
        const cached = await readFile(CACHE_FILE, 'utf-8');
        return JSON.parse(cached) as GazetteerRecord[];
      } catch {
        // download and cache
      }
      const r = await fetchFn(GAZETTEER_URL);
      if (!r.ok) {
        throw new Error(`Gazetteer download failed: ${r.status}`);
      }
      const buffer = Buffer.from(await r.arrayBuffer());
      const records = parseGazetteerZip(buffer);
      await mkdir(CACHE_DIR, { recursive: true });
      await writeFile(CACHE_FILE, JSON.stringify(records));
      return records;
    },

    async fetchAcsPopulation(zctas: string[]): Promise<Record<string, number>> {
      const popMap: Record<string, number> = {};
      const batchSize = 50;
      for (let i = 0; i < zctas.length; i += batchSize) {
        const batch = zctas.slice(i, i + batchSize);
        const params = new URLSearchParams({
          get: 'NAME,B01003_001E',
          for: `zip code tabulation area:${batch.join(',')}`,
        });
        if (apiKey) params.set('key', apiKey);
        try {
          const r = await fetchFn(`https://api.census.gov/data/2023/acs/acs5?${params}`);
          const rows = (await r.json()) as string[][];
          if (!Array.isArray(rows)) continue;
          for (const row of rows.slice(1)) {
            popMap[row[2]] = row[1] ? parseInt(row[1], 10) : 0;
          }
        } catch {
          // batch failed — continue
        }
      }
      return popMap;
    },
  };
}
