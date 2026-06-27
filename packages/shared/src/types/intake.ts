import { z } from 'zod';

export const scanTierSchema = z.enum(['basic', 'advanced_premium']);
export const bizTierSchema = z.enum(['Basic', 'Advanced', 'Premium']);

export const scanIntakeSchema = z.object({
  bizName: z.string().min(1),
  bizAddress: z.string().min(1),
  bizDomain: z.string().min(1),
  bizCity: z.string().min(1),
  bizVertical: z.string().min(1),
  bizType: z.string().min(1),
  verticalKey: z.string().min(1),
  gbpPrimaryCategory: z.string().optional(),
  bizTier: bizTierSchema.default('Basic'),
  scanTier: scanTierSchema.default('basic'),
  ownerServices: z.array(z.string().min(1)).min(1).max(10),
});

export type ScanIntake = z.infer<typeof scanIntakeSchema>;

export type ScanStatus = 'queued' | 'running' | 'partial' | 'complete' | 'failed';
