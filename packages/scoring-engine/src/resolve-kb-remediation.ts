import type { KbRemediationSection } from '@growthpath/shared';
import { KB_SECTIONS, getKbEntry, isKbKey } from './kb-registry.js';

export function resolveKbRemediation(triggeredKeys: string[]): KbRemediationSection[] {
  const resolved = triggeredKeys
    .filter(isKbKey)
    .map((key) => {
      const entry = getKbEntry(key)!;
      return {
        key,
        title: entry.title,
        why: entry.why,
        howGoogle: entry.how_google,
        fixSteps: entry.fix,
        priority: entry.priority,
        effort: entry.effort,
        impact: entry.impact,
        sectionId: entry.section,
      };
    })
    .sort((a, b) => a.priority - b.priority);

  const bySection = new Map<string, typeof resolved>();
  for (const item of resolved) {
    const list = bySection.get(item.sectionId) ?? [];
    list.push(item);
    bySection.set(item.sectionId, list);
  }

  return KB_SECTIONS.filter((section) => bySection.has(section.id)).map((section) => ({
    id: section.id,
    number: section.number,
    title: section.title,
    narrative: section.narrative,
    stat: section.stat,
    statLabel: section.statLabel,
    entries: (bySection.get(section.id) ?? []).map(({ sectionId: _s, ...entry }) => entry),
  }));
}
