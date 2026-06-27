#!/usr/bin/env node
import { loadWorkerEnv, preflightScanCredentials } from '@growthpath/config';
import { deriveScanStatusFromCollection, scanIntakeSchema } from '@growthpath/shared';
import { runScan } from '../run-scan.js';

const STABLE_INTAKE = scanIntakeSchema.parse({
  bizName: 'Kitchen 747',
  bizAddress: '747 Main St, Roseville, CA 95747',
  bizDomain: 'kitchen747.com',
  bizCity: 'Roseville',
  bizVertical: 'Food & Beverage',
  bizType: 'Burger Restaurant',
  verticalKey: 'restaurant',
  bizTier: 'Advanced',
  scanTier: 'advanced_premium',
  ownerServices: ['burgers', 'pizza', 'live music'],
});

async function main(): Promise<void> {
  const env = loadWorkerEnv();
  const preflight = preflightScanCredentials(env);

  console.log('GrowthPath live scan smoke harness');
  console.log(`Mock mode: ${preflight.mockMode ? 'ON' : 'OFF'}`);
  console.log(`Ready for live: ${preflight.readyForLive ? 'YES' : 'NO'}`);
  console.log('');

  if (!preflight.readyForLive) {
    console.error('Missing required credentials. Set GOOGLE_API_KEY, DFS_LOGIN, DFS_PASSWORD and SCAN_MOCK=0.');
    for (const source of preflight.sources) {
      if (!source.liveCapable && source.reason) {
        console.error(`  - ${source.label}: ${source.reason}`);
      }
    }
    process.exit(1);
  }

  const started = Date.now();
  const audit = await runScan(
    STABLE_INTAKE,
    {
      GOOGLE_API_KEY: env.GOOGLE_API_KEY,
      CENSUS_API_KEY: env.CENSUS_API_KEY,
      DFS_LOGIN: env.DFS_LOGIN,
      DFS_PASSWORD: env.DFS_PASSWORD,
      MOZ_API_KEY: env.MOZ_API_KEY,
    },
    { mock: false },
  );

  const { status, partialReasons } = deriveScanStatusFromCollection(audit.collection_status ?? []);
  const elapsedSec = ((Date.now() - started) / 1000).toFixed(1);

  console.log(`Scan finished in ${elapsedSec}s — status: ${status}`);
  console.log(`Total cost: $${(audit.total_cost ?? 0).toFixed(4)}`);
  if (partialReasons.length > 0) {
    console.log('Partial reasons:');
    for (const reason of partialReasons) console.log(`  - ${reason}`);
  }

  console.log('\nPer-source collection status:');
  for (const row of audit.collection_status ?? []) {
    const duration = row.durationMs != null ? `${row.durationMs}ms` : '—';
    const cost = row.cost != null ? `$${row.cost.toFixed(4)}` : '—';
    console.log(
      `  ${row.sourceId.padEnd(18)} ${row.status.padEnd(8)} ${duration.padStart(8)}  cost ${cost.padStart(10)}  ${row.detail}`,
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
