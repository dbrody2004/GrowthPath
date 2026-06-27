import { z } from 'zod';

export const actionPlanProgressUpdateSchema = z.object({
  completedTaskIds: z.array(z.number().int().nonnegative()),
});

export type ActionPlanProgressUpdate = z.infer<typeof actionPlanProgressUpdateSchema>;

/** Keeps only integer task ids that exist in the scan presentation. */
export function filterActionPlanCompletedTaskIds(
  completedTaskIds: number[],
  validTaskIds: readonly number[],
): number[] {
  const valid = new Set(validTaskIds);
  const seen = new Set<number>();
  const filtered: number[] = [];
  for (const id of completedTaskIds) {
    if (!Number.isInteger(id) || !valid.has(id) || seen.has(id)) continue;
    seen.add(id);
    filtered.push(id);
  }
  return filtered;
}
