import cron from 'node-cron';
import { loadWorkerEnv } from '@growthpath/config';
import { createLogger } from './lib/logger.js';
import { connectMongo, disconnectMongo } from './lib/mongo.js';
import { startConsumer } from './lib/rabbitmq.js';

let shuttingDown = false;

async function main() {
  const env = loadWorkerEnv();
  const log = createLogger(env);

  await connectMongo(env);
  log.info('Worker connected to MongoDB');

  const stopConsumer = await startConsumer(env, log);

  const cronJob = cron.schedule('0 * * * *', () => {
    log.info('Scheduled cron placeholder tick');
  });

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info({ signal }, 'Shutting down worker');
    cronJob.stop();
    await stopConsumer();
    await disconnectMongo();
    process.exit(0);
  };

  const onSignal = (signal: string) =>
    void shutdown(signal).catch((err) => {
      log.error({ err, signal }, 'Error during shutdown');
      process.exit(1);
    });

  process.on('SIGINT', () => onSignal('SIGINT'));
  process.on('SIGTERM', () => onSignal('SIGTERM'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
