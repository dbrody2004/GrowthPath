import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { ApiEnv } from '@growthpath/config';

export function createS3Client(env: Pick<ApiEnv, 'S3_REGION' | 'S3_ENDPOINT' | 'S3_FORCE_PATH_STYLE' | 'S3_ACCESS_KEY_ID' | 'S3_SECRET_ACCESS_KEY'>): S3Client {
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

export async function putObject(
  env: Pick<ApiEnv, 'S3_BUCKET' | 'S3_REGION' | 'S3_ENDPOINT' | 'S3_FORCE_PATH_STYLE' | 'S3_ACCESS_KEY_ID' | 'S3_SECRET_ACCESS_KEY'>,
  key: string,
  body: string | Buffer,
  contentType = 'application/octet-stream',
): Promise<void> {
  const client = createS3Client(env);
  await client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function getPresignedDownloadUrl(
  env: Pick<ApiEnv, 'S3_BUCKET' | 'S3_REGION' | 'S3_ENDPOINT' | 'S3_FORCE_PATH_STYLE' | 'S3_ACCESS_KEY_ID' | 'S3_SECRET_ACCESS_KEY'>,
  key: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const client = createS3Client(env);
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    }),
    { expiresIn: expiresInSeconds },
  );
}

export function scanPdfObjectKey(scanId: string): string {
  return `exports/scans/${scanId}/report.pdf`;
}
