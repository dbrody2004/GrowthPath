import { loadApiEnv } from '@growthpath/config';
import {
  createScan,
  findSampleScan,
  saveScanResult,
  updateScanStatus,
  upsertBusiness,
} from '@growthpath/data';
import { connectMongo, disconnectMongo } from '../lib/mongo.js';
import { User, hashPassword } from '../models/user.js';
import {
  buildKitchen747SamplePayload,
  KITCHEN747_SAMPLE_SEED_KEY,
} from './fixtures/build-kitchen747-sample.js';

async function ensureSampleUser(env: ReturnType<typeof loadApiEnv>) {
  const email = env.SEED_SAMPLE_USER_EMAIL.toLowerCase();
  let user = await User.findOne({ email });
  if (user) {
    return user;
  }

  const passwordHash =
    env.SEED_SAMPLE_USER_PASSWORD_HASH ??
    (await hashPassword(
      env.SEED_SAMPLE_USER_PASSWORD ??
        (() => {
          throw new Error(
            'Set SEED_SAMPLE_USER_PASSWORD_HASH or SEED_SAMPLE_USER_PASSWORD to create the sample user',
          );
        })(),
    ));

  user = await User.create({
    email,
    passwordHash,
    role: 'user',
  });

  console.log(`Created sample user: ${email}`);
  return user;
}

async function seedSampleScan() {
  const env = loadApiEnv();
  await connectMongo(env);

  const user = await ensureSampleUser(env);
  const payload = buildKitchen747SamplePayload();

  const business = await upsertBusiness(payload.intake);

  let scan = await findSampleScan(user._id, KITCHEN747_SAMPLE_SEED_KEY);
  if (!scan) {
    scan = await createScan(business._id, payload.intake.scanTier, {
      userId: user._id,
      sampleSeedKey: KITCHEN747_SAMPLE_SEED_KEY,
    });
    console.log(`Created sample scan: ${scan._id.toString()}`);
  } else {
    console.log(`Updating existing sample scan: ${scan._id.toString()}`);
  }

  await updateScanStatus(scan._id.toString(), {
    status: 'running',
    startedAt: scan.startedAt ?? new Date(),
    collectionStatus: payload.auditData.collection_status ?? [],
  });

  await saveScanResult({
    scanId: scan._id,
    businessId: business._id,
    auditData: payload.auditData as unknown as Record<string, unknown>,
    scores: payload.scores as unknown as Record<string, unknown>,
    p1: payload.p1,
    p2: payload.p2,
    profile: payload.profile,
  });

  await updateScanStatus(scan._id.toString(), {
    status: 'complete',
    completedAt: new Date(),
    totalCost: 0,
    partialReasons: [],
    collectionStatus: payload.auditData.collection_status ?? [],
  });

  console.log(`Seeded Kitchen 747 sample scan for ${user.email}`);
  console.log(`  Scan ID: ${scan._id.toString()}`);
  console.log(`  P1: ${payload.p1}  P2: ${payload.p2}  Profile: ${payload.profile}`);

  await disconnectMongo();
}

seedSampleScan().catch((error) => {
  console.error(error);
  process.exit(1);
});
