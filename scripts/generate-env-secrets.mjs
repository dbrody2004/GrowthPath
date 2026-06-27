#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';

const secrets = {
  MONGO_ROOT_PASSWORD: crypto.randomBytes(16).toString('hex'),
  RABBITMQ_PASSWORD: crypto.randomBytes(16).toString('hex'),
  S3_ACCESS_KEY_ID: crypto.randomBytes(8).toString('hex'),
  S3_SECRET_ACCESS_KEY: crypto.randomBytes(16).toString('hex'),
  SESSION_SECRET: crypto.randomBytes(32).toString('hex'),
  SEED_ADMIN_PASSWORD: crypto.randomBytes(16).toString('hex'),
};

console.log('# Generated secrets — copy into .env');
console.log('MONGO_ROOT_USER=growthpath');
for (const [key, value] of Object.entries(secrets)) {
  console.log(`${key}=${value}`);
}
console.log(
  `MONGODB_URI=mongodb://growthpath:${secrets.MONGO_ROOT_PASSWORD}@127.0.0.1:27118/growthpath?authSource=admin`,
);
console.log(`RABBITMQ_USER=growthpath`);
console.log(`RABBITMQ_URL=amqp://growthpath:${secrets.RABBITMQ_PASSWORD}@127.0.0.1:5674`);
console.log(`S3_ENDPOINT=http://127.0.0.1:9004`);

if (process.argv.includes('--write')) {
  const target = '.env.generated';
  fs.writeFileSync(
    target,
    Object.entries(secrets)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n') + '\n',
  );
  console.error(`Wrote ${target}`);
}
