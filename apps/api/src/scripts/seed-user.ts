import { loadApiEnv } from '@growthpath/config';
import { connectMongo, disconnectMongo } from '../lib/mongo.js';
import { User, hashPassword, type UserRole } from '../models/user.js';

function readPasswordFromStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => resolve(data.replace(/\r?\n$/, '')));
    process.stdin.on('error', reject);
  });
}

async function seedUser() {
  const env = loadApiEnv();

  const email = (process.env.SEED_USER_EMAIL ?? '').toLowerCase().trim();
  if (!email) {
    throw new Error('Set SEED_USER_EMAIL to seed a user');
  }

  const role: UserRole = process.env.SEED_USER_ROLE === 'admin' ? 'admin' : 'user';

  // Read the plaintext password from stdin so it is never persisted to a file,
  // shell args, or env files. bcrypt generates a per-hash salt (cost factor 12).
  const password = process.env.SEED_USER_PASSWORD_HASH ? '' : await readPasswordFromStdin();
  const passwordHash =
    process.env.SEED_USER_PASSWORD_HASH ??
    (await hashPassword(
      password ||
        (() => {
          throw new Error('Provide the password via stdin or SEED_USER_PASSWORD_HASH');
        })(),
    ));

  await connectMongo(env);

  const existing = await User.findOne({ email });
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = role;
    await existing.save();
    console.log(`Updated existing user: ${email} (role: ${role})`);
  } else {
    await User.create({ email, passwordHash, role });
    console.log(`Seeded user: ${email} (role: ${role})`);
  }

  await disconnectMongo();
}

seedUser().catch((error) => {
  console.error(error);
  process.exit(1);
});
