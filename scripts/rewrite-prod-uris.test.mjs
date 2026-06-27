import { describe, expect, it } from 'vitest';
import { rewriteProdUris } from './rewrite-prod-uris.mjs';

describe('rewriteProdUris', () => {
  it('rewrites local Mongo, RabbitMQ, and MinIO URLs', () => {
    const input = [
      'MONGODB_URI=mongodb://127.0.0.1:27118/growthpath',
      'RABBITMQ_URL=amqp://guest:guest@127.0.0.1:5674',
      'S3_ENDPOINT=http://127.0.0.1:9004',
    ].join('\n');

    const output = rewriteProdUris(input);
    expect(output).toContain('mongodb://mongo:27017/growthpath');
    expect(output).toContain('amqp://guest:guest@rabbitmq:5672');
    expect(output).toContain('http://minio:9000');
  });

  it('preserves credentials when rewriting hosts', () => {
    const input = [
      'MONGODB_URI=mongodb://growthpath:secret@127.0.0.1:27118/growthpath?authSource=admin',
      'RABBITMQ_URL=amqp://growthpath:secret@127.0.0.1:5674',
    ].join('\n');

    const output = rewriteProdUris(input);
    expect(output).toContain('mongodb://growthpath:secret@mongo:27017/growthpath?authSource=admin');
    expect(output).toContain('amqp://growthpath:secret@rabbitmq:5672');
  });
});
