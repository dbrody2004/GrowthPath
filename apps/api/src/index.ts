import { loadApiEnv } from '@growthpath/config';
import { createApp } from './app.js';
import { createLogger } from './lib/logger.js';
import { connectMongo, disconnectMongo } from './lib/mongo.js';
import { closePublisher } from './lib/rabbitmq.js';

async function main() {
  const env = loadApiEnv();
  const log = createLogger(env);
  const app = createApp(env, log);

  await connectMongo(env);
  log.info('Connected to MongoDB');

  const server = app.listen(env.API_PORT, env.API_HOST, () => {
    log.info({ port: env.API_PORT }, 'API listening');
  });

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info({ signal }, 'Shutting down API');
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await closePublisher();
    await disconnectMongo();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT').catch((err) => { log.error(err); process.exit(1); }));
  process.on('SIGTERM', () => void shutdown('SIGTERM').catch((err) => { log.error(err); process.exit(1); }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
