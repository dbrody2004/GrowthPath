import mongoose from 'mongoose';
import type { WorkerEnv } from '@growthpath/config';

export async function connectMongo(env: WorkerEnv): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI);
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}
