export const FOCUS_PAGE = "/focus.html";

export type DnrRule = {
  id: number;
  priority: number;
  action: { type: "redirect"; redirect: { extensionPath: string } };
  condition: { urlFilter: string; resourceTypes: ["main_frame"] };
};

export type ExistingRule = { id: number; action?: { type?: string }; condition: { urlFilter?: string } };

export type RuleDiff = { removeRuleIds: number[]; addRules: DnrRule[] };

export const buildRule = (id: number, urlFilter: string): DnrRule => ({
  id,
  priority: 1,
  action: { type: "redirect", redirect: { extensionPath: FOCUS_PAGE } },
  condition: { urlFilter, resourceTypes: ["main_frame"] },
});

/**
 * Compute the minimal update to turn the existing dynamic rules into one redirect rule per filter.
 * Rules already matching a desired filter are kept; duplicates and stale rules are removed;
 * missing ones are added with unused ids.
 */
export const diffRules = (existing: ExistingRule[], desiredFilters: string[]): RuleDiff => {
  const wanted = new Set(desiredFilters);
  const kept = new Set<string>();
  const removeRuleIds: number[] = [];
  const usedIds = new Set<number>();

  for (const rule of existing) {
    const filter = rule.condition.urlFilter;
    if (filter !== undefined && wanted.has(filter) && rule.action?.type === "redirect" && !kept.has(filter)) {
      kept.add(filter);
      usedIds.add(rule.id);
    } else {
      removeRuleIds.push(rule.id);
    }
  }

  const addRules: DnrRule[] = [];
  let nextId = 1;
  for (const filter of wanted) {
    if (kept.has(filter)) continue;
    while (usedIds.has(nextId)) nextId++;
    usedIds.add(nextId);
    addRules.push(buildRule(nextId, filter));
  }
  return { removeRuleIds, addRules };
};
