import { describe, expect, it } from 'vitest';
import { filterActionPlanCompletedTaskIds } from './action-plan.js';

describe('filterActionPlanCompletedTaskIds', () => {
  it('keeps only valid task ids in order', () => {
    expect(filterActionPlanCompletedTaskIds([1, 99, 2, 2, 1.5, -1], [1, 2, 3])).toEqual([1, 2]);
  });

  it('returns empty when nothing matches', () => {
    expect(filterActionPlanCompletedTaskIds([10, 11], [1, 2])).toEqual([]);
  });
});
