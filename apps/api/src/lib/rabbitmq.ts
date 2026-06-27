import amqp from 'amqplib';
import { QUEUE } from '@growthpath/shared';
import type { ApiEnv } from '@growthpath/config';
import type { Logger } from './logger.js';

let connection: amqp.ChannelModel | null = null;
let channel: amqp.Channel | null = null;
// Shared in-flight promise so concurrent first callers don't open multiple connections.
let channelPromise: Promise<amqp.Channel> | null = null;

async function initChannel(env: ApiEnv, log: Logger): Promise<amqp.Channel> {
  const conn = await amqp.connect(env.RABBITMQ_URL);
  conn.on('error', (error) => log.error({ error }, 'RabbitMQ connection error'));
  conn.on('close', () => {
    channel = null;
    connection = null;
  });

  const ch = await conn.createChannel();
  ch.on('error', (error) => log.error({ error }, 'RabbitMQ channel error'));
  ch.on('close', () => {
    channel = null;
  });

  try {
    await ch.assertExchange(QUEUE.EXCHANGE, 'direct', { durable: true });
    await ch.assertExchange(QUEUE.DLX, 'direct', { durable: true });
    await ch.assertQueue(QUEUE.DLQ, { durable: true });
    await ch.bindQueue(QUEUE.DLQ, QUEUE.DLX, QUEUE.ROUTING_KEY);
    await ch.assertQueue(QUEUE.MAIN_QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': QUEUE.DLX,
        'x-dead-letter-routing-key': QUEUE.ROUTING_KEY,
      },
    });
    await ch.bindQueue(QUEUE.MAIN_QUEUE, QUEUE.EXCHANGE, QUEUE.ROUTING_KEY);
  } catch (err) {
    channel = null;
    connection = null;
    try {
      await ch.close();
    } catch (closeErr) {
      log.error({ error: closeErr }, 'Failed to close RabbitMQ channel after init error');
    }
    try {
      await conn.close();
    } catch (closeErr) {
      log.error({ error: closeErr }, 'Failed to close RabbitMQ connection after init error');
    }
    throw err;
  }

  connection = conn;
  channel = ch;
  return channel;
}

export async function getPublisherChannel(env: ApiEnv, log: Logger): Promise<amqp.Channel> {
  if (channel) return channel;
  if (!channelPromise) {
    channelPromise = initChannel(env, log).finally(() => {
      channelPromise = null;
    });
  }
  return channelPromise;
}

export async function publishJob(
  env: ApiEnv,
  log: Logger,
  message: unknown,
): Promise<void> {
  const ch = await getPublisherChannel(env, log);
  const payload = Buffer.from(JSON.stringify(message));
  const ok = ch.publish(QUEUE.EXCHANGE, QUEUE.ROUTING_KEY, payload, {
    contentType: 'application/json',
    persistent: true,
  });
  if (!ok) {
    throw new Error('RabbitMQ channel write buffer full; message not enqueued');
  }
}

export async function closePublisher(): Promise<void> {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
}
