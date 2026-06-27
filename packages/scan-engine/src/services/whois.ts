import type { WhoisData } from '@growthpath/shared';
import whoiser from 'whoiser';

export interface WhoisClient {
  lookup(domain: string): Promise<WhoisData>;
}

export function createWhoisClient(): WhoisClient {
  return {
    async lookup(domain: string): Promise<WhoisData> {
      try {
        const result = await whoiser(domain, { timeout: 15000 });
        const rawEntry = result[domain] ?? Object.values(result)[0];
        const entry = (typeof rawEntry === 'object' && rawEntry !== null
          ? rawEntry
          : {}) as Record<string, unknown>;
        let created: Date | null = null;
        const createdRaw = entry['Created Date'] ?? entry.created ?? entry.creationDate;
        if (createdRaw) {
          const d = new Date(String(createdRaw));
          if (!Number.isNaN(d.getTime())) created = d;
        }
        const now = new Date();
        const ageYears = created
          ? Math.round(((now.getTime() - created.getTime()) / 86_400_000 / 365.25) * 10) / 10
          : null;
        return {
          domain,
          age_years: ageYears,
          created: created ? String(created) : undefined,
          registrar: String(entry['Registrar'] ?? entry.registrar ?? ''),
          https: false,
        };
      } catch {
        return { domain, age_years: null, https: false };
      }
    },
  };
}

export async function fetchWhois(ctx: { whois: WhoisClient }, url: string): Promise<WhoisData> {
  const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  const data = await ctx.whois.lookup(domain);
  data.https = url.startsWith('https://');
  return data;
}
