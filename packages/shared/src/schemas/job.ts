import { z } from 'zod';
import { JOB_TYPES } from '../constants.js';

export const sampleJobMessageSchema = z.object({
  type: z.literal(JOB_TYPES.SAMPLE),
  payload: z.record(z.unknown()).default({}),
  enqueuedAt: z.string().datetime().optional(),
});

export const scanJobMessageSchema = z.object({
  type: z.literal(JOB_TYPES.SCAN),
  scanId: z.string().min(1),
  enqueuedAt: z.string().datetime().optional(),
  /** When set, merge results from this prior scan instead of starting blank. */
  retryOfScanId: z.string().min(1).optional(),
  /** full = re-run all sources; missing_sources = only failed/missing sources from prior scan. */
  retryMode: z.enum(['full', 'missing_sources']).optional(),
  /** Explicit source list to re-collect (overrides missing_sources inference). */
  sourcesToRetry: z
    .array(
      z.enum([
        'gbp',
        'gbp_posts',
        'moz',
        'moz_competitors',
        'trade_area',
        'serp',
        'local_finder',
        'whois',
        'html',
        'content_depth',
        'pagespeed',
        'psi_accessibility',
        'competitor_agg',
      ]),
    )
    .optional(),
});

export const exportPdfJobMessageSchema = z.object({
  type: z.literal(JOB_TYPES.EXPORT_PDF),
  scanId: z.string().min(1),
  exportToken: z.string().min(1),
  enqueuedAt: z.string().datetime().optional(),
});

export const jobMessageSchema = z.discriminatedUnion('type', [
  sampleJobMessageSchema,
  scanJobMessageSchema,
  exportPdfJobMessageSchema,
]);

export type JobMessage = z.infer<typeof jobMessageSchema>;
export type ScanJobMessage = z.infer<typeof scanJobMessageSchema>;
export type ExportPdfJobMessage = z.infer<typeof exportPdfJobMessageSchema>;
