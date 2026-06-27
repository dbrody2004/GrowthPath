import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { WorkerEnv } from '@growthpath/config';

let s3Singleton: S3Client | null = null;

export function createS3Client(env: WorkerEnv): S3Client {
  return new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });
}

function getS3Client(env: WorkerEnv): S3Client {
  if (!s3Singleton) {
    s3Singleton = createS3Client(env);
  }
  return s3Singleton;
}

export async function putObject(
  env: WorkerEnv,
  key: string,
  body: string | Buffer,
  contentType = 'application/octet-stream',
): Promise<void> {
  const client = getS3Client(env);
  await client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export function scanPdfObjectKey(scanId: string): string {
  return `exports/scans/${scanId}/report.pdf`;
}
