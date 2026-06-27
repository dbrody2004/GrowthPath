import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { calculateScores } from '@growthpath/scoring-engine';
import { runScan } from '@growthpath/scan-engine';
import { deriveScanStatusFromCollection, scanIntakeSchema } from '@growthpath/shared';
import {
  createScan,
  getScanById,
  getScanResult,
  saveScanResult,
  updateScanStatus,
  upsertBusiness,
} from '@growthpath/data';

describe('scan pipeline integration', () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('runs mock scan -> scoring -> persist with status transitions', async () => {
    const intake = scanIntakeSchema.parse({
      bizName: 'Kitchen 747',
      bizAddress: '747 Main St, Roseville, CA 95747',
      bizDomain: 'kitchen747.com',
      bizCity: 'Roseville',
      bizVertical: 'Food & Beverage',
      bizType: 'Burger Restaurant',
      verticalKey: 'restaurant',
      bizTier: 'Basic',
      scanTier: 'basic',
      ownerServices: ['burgers', 'pizza', 'live music'],
    });

    const business = await upsertBusiness(intake);
    const scan = await createScan(business._id, intake.scanTier);

    expect(scan.status).toBe('queued');

    await updateScanStatus(scan._id.toString(), {
      status: 'running',
      startedAt: new Date(),
    });

    const auditData = await runScan(intake, {
      GOOGLE_API_KEY: 'test',
      CENSUS_API_KEY: '',
      DFS_LOGIN: 'test',
      DFS_PASSWORD: 'test',
      MOZ_API_KEY: '',
    }, { mock: true });

    const scores = calculateScores(auditData);

    expect(scores.p1).toBe(42);
    expect(scores.p2).toBe(46);
    expect(scores.profile).toBe('The Invisible Closer');

    const { status, partialReasons } = deriveScanStatusFromCollection(auditData.collection_status ?? []);

    await saveScanResult({
      scanId: scan._id,
      businessId: business._id,
      auditData: auditData as unknown as Record<string, unknown>,
      scores: scores as unknown as Record<string, unknown>,
      p1: scores.p1,
      p2: scores.p2,
      profile: scores.profile,
    });

    await updateScanStatus(scan._id.toString(), {
      status,
      completedAt: new Date(),
      totalCost: auditData.total_cost ?? 0,
      partialReasons,
    });

    const updated = await getScanById(scan._id.toString());
    expect(updated?.status).toBe('complete');

    const result = await getScanResult(scan._id.toString());
    expect(result?.p1).toBe(42);
    expect(result?.profile).toBe('The Invisible Closer');
  });
});
