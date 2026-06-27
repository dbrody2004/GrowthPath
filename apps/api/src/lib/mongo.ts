import mongoose from 'mongoose';
import type { ApiEnv } from '@growthpath/config';

export async function connectMongo(env: ApiEnv): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI);
  return mongoose;
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}
