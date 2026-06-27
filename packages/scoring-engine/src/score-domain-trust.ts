import type { Finding, MozData, SignalPts, WhoisData } from '@growthpath/shared';

const RD_THRESHOLDS: Record<string, [number, number][]> = {
  restaurant: [
    [200, 30],
    [100, 22],
    [40, 14],
    [15, 7],
  ],
  medspa: [
    [150, 30],
    [60, 22],
    [25, 14],
    [10, 7],
  ],
  salon: [
    [200, 30],
    [80, 22],
    [30, 14],
    [12, 7],
  ],
  service: [
    [100, 30],
    [40, 22],
    [20, 14],
    [8, 7],
  ],
  home_trade: [
    [80, 30],
    [35, 22],
    [15, 14],
    [6, 7],
  ],
  professional_service: [
    [60, 30],
    [25, 22],
    [10, 14],
    [4, 7],
  ],
  real_estate: [
    [80, 30],
    [35, 22],
    [15, 14],
    [6, 7],
  ],
};

export function scoreDomainTrust(
  whois: WhoisData,
  moz: MozData | null = null,
  vertical = 'service',
): [number, Finding[], { da: number; referring_domains: number }, SignalPts] {
  let points = 0;
  const findings: Finding[] = [];
  const mozClient = moz?.client ?? { domain: '', da: null, referring_domains: null };
  const da = mozClient.da ?? 0;
  const rd = mozClient.referring_domains ?? 0;
  const whoisAge = whois.age_years ?? null;
  const https = whois.https ?? false;

  let daPts = 0;
  if (da >= 40) daPts = 50;
  else if (da >= 25) daPts = 35;
  else if (da >= 15) daPts = 20;
  else if (da >= 5) daPts = 10;
  points += daPts;

  if (da >= 30) {
    // Leading — no finding
  } else if (da >= 20) {
    findings.push({
      text: `Domain Authority ${da}/100 — you're in competitive range. Consistent directory citations and local press mentions are the path to 30+, which is the leading threshold for most local markets.`,
      severity: 'warning',
      kb_key: 'DA_LOW',
    });
  } else if (da >= 10) {
    findings.push({
      text: `Domain Authority ${da}/100 — below the competitive threshold. Directory listings (Yelp, BBB, industry directories, chamber of commerce) are the fastest lever — each adds a referring domain and strengthens category authority.`,
      severity: 'warning',
      kb_key: 'DA_LOW',
    });
  } else if (da > 0) {
    findings.push({
      text: `Domain Authority ${da}/100 — critically low. Your backlink profile has not been established. Start with free directory citations: Yelp, BBB, Google Business Profile, chamber of commerce, and any industry-specific directories. Each one adds a referring domain and builds the foundation.`,
      severity: 'critical',
      kb_key: 'DA_LOW',
    });
  } else if (!mozClient.da && mozClient.da !== 0) {
    findings.push({
      text: 'Domain Authority data unavailable — Moz API may not have indexed this domain yet.',
      severity: 'warning',
    });
  }

  const tiers = RD_THRESHOLDS[vertical] ?? RD_THRESHOLDS.service;
  let rdPts = 0;
  for (const [threshold, pts] of tiers) {
    if (rd >= threshold) {
      rdPts = pts;
      break;
    }
  }
  points += rdPts;

  const lowestThreshold = tiers[tiers.length - 1]?.[0] ?? 0;
  if (rd < lowestThreshold && rd > 0) {
    findings.push({
      text: `${rd} unique sites linking to your domain. Claiming free high-authority directory listings is the fastest path to more referring domains — each adds a link and strengthens category authority.`,
      severity: rd >= 10 ? 'warning' : 'critical',
      kb_key: 'REFERRING_DOMAINS_LOW',
    });
  }

  if (https) {
    points += 10;
  } else {
    findings.push({
      text: 'HTTPS not detected. Security gap and ranking signal missing.',
      severity: 'critical',
    });
  }

  let agePts = 0;
  if (whoisAge == null) {
    findings.push({
      text: 'Domain age unavailable — WHOIS data not returned for this domain.',
      severity: 'warning',
      kb_key: 'DOMAIN_AGE_YOUNG',
    });
  } else {
    if (whoisAge >= 5) agePts = 10;
    else if (whoisAge >= 3) agePts = 7;
    else if (whoisAge >= 1) agePts = 4;
    else agePts = 1;

    if (whoisAge < 3) {
      findings.push({
        text: `Domain age ${whoisAge.toFixed(1)} years — below 3-year threshold for established authority signal.`,
        severity: 'warning',
        kb_key: 'DOMAIN_AGE_YOUNG',
      });
    }
  }
  points += agePts;

  const trustSignalPts: SignalPts = {
    domain_authority: { earned: daPts, max: 50 },
    referring_domains: { earned: rdPts, max: 30 },
    https: { earned: https ? 10 : 0, max: 10 },
    domain_age: { earned: agePts, max: 10 },
  };

  return [Math.min(100, points), findings, { da, referring_domains: rd }, trustSignalPts];
}
