import amqp, { type Channel, type ConsumeMessage } from 'amqplib';
import { JOB_TYPES, jobMessageSchema, QUEUE } from '@growthpath/shared';
import type { WorkerEnv } from '@growthpath/config';
import type { Logger } from './logger.js';
import { handleSampleJob } from '../jobs/sample.js';
import { handleScanJob } from '../jobs/scan.js';
import { handleExportPdfJob } from '../jobs/export-pdf.js';

export async function startConsumer(env: WorkerEnv, log: Logger): Promise<() => Promise<void>> {
  const connection = await amqp.connect(env.RABBITMQ_URL);
  let intentionalClose = false;
  connection.on('error', (error) => log.error({ error }, 'RabbitMQ connection error'));
  connection.on('close', () => {
    if (intentionalClose) return;
    log.warn('RabbitMQ connection closed unexpectedly');
    process.exit(1);
  });
  const channel: Channel = await connection.createChannel();
  await channel.prefetch(Math.min(env.RABBITMQ_PREFETCH, 1));

  await channel.assertExchange(QUEUE.EXCHANGE, 'direct', { durable: true });
  await channel.assertExchange(QUEUE.DLX, 'direct', { durable: true });
  await channel.assertQueue(QUEUE.DLQ, { durable: true });
  await channel.bindQueue(QUEUE.DLQ, QUEUE.DLX, QUEUE.ROUTING_KEY);
  await channel.assertQueue(QUEUE.MAIN_QUEUE, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': QUEUE.DLX,
      'x-dead-letter-routing-key': QUEUE.ROUTING_KEY,
    },
  });
  await channel.bindQueue(QUEUE.MAIN_QUEUE, QUEUE.EXCHANGE, QUEUE.ROUTING_KEY);

  const inFlight = new Set<Promise<void>>();

  const onMessage = async (msg: ConsumeMessage | null) => {
    if (!msg) return;

    try {
      const parsed = jobMessageSchema.parse(JSON.parse(msg.content.toString()));
      log.info({ type: parsed.type }, 'Processing job');

      if (parsed.type === JOB_TYPES.SAMPLE) {
        await handleSampleJob(parsed, log);
      } else if (parsed.type === JOB_TYPES.SCAN) {
        await handleScanJob(parsed, env, log);
      } else if (parsed.type === JOB_TYPES.EXPORT_PDF) {
        await handleExportPdfJob(parsed, env, log);
      } else {
        throw new Error(`Unknown job type: ${(parsed as { type: string }).type}`);
      }
    } catch (error) {
      log.error({ error }, 'Job failed');
      try {
        channel.nack(msg, false, false);
      } catch (nackError) {
        log.error({ error: nackError }, 'Failed to nack message');
      }
      return;
    }

    try {
      channel.ack(msg);
    } catch (ackError) {
      log.error({ error: ackError }, 'Failed to ack message');
    }
  };

  const { consumerTag } = await channel.consume(QUEUE.MAIN_QUEUE, (msg) => {
    const job = onMessage(msg);
    inFlight.add(job);
    void job.finally(() => inFlight.delete(job));
  });

  log.info({ queue: QUEUE.MAIN_QUEUE }, 'Worker consuming jobs');

  return async () => {
    intentionalClose = true;
    await channel.cancel(consumerTag);
    await Promise.race([
      Promise.allSettled([...inFlight]),
      new Promise<void>((resolve) => setTimeout(resolve, 30_000)),
    ]);
    await channel.close();
    await connection.close();
  };
}
