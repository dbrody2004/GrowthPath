import { loadApiEnv } from '@growthpath/config';
import { connectMongo, disconnectMongo } from '../lib/mongo.js';
import { User, hashPassword } from '../models/user.js';

async function seed() {
  const env = loadApiEnv();
  await connectMongo(env);

  const email = env.SEED_ADMIN_EMAIL.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    await disconnectMongo();
    return;
  }

  const passwordHash = env.SEED_ADMIN_PASSWORD_HASH
    ?? await hashPassword(env.SEED_ADMIN_PASSWORD ?? (() => {
      throw new Error('Set SEED_ADMIN_PASSWORD_HASH or SEED_ADMIN_PASSWORD for seeding');
    })());

  await User.create({
    email,
    passwordHash,
    role: 'admin',
  });

  console.log(`Seeded admin user: ${email}`);
  await disconnectMongo();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
