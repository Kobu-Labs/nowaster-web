export const FOCUS_PAGE = "/focus.html";

export type RuleAction = "redirect" | "block";

export type DnrRule = {
  id: number;
  priority: number;
  action: { type: "redirect"; redirect: { extensionPath: string } } | { type: "block" };
  condition: { urlFilter: string; resourceTypes: ["main_frame"] };
};

export type ExistingRule = { id: number; action?: { type?: string }; condition: { urlFilter?: string } };

/** A rule the session wants: which URLs, and whether we may redirect them or only block. */
export type DesiredRule = { urlFilter: string; action: RuleAction };

export type RuleDiff = { removeRuleIds: number[]; addRules: DnrRule[] };

export const buildRule = (id: number, urlFilter: string, action: RuleAction = "redirect"): DnrRule => ({
  id,
  priority: 1,
  action: action === "redirect" ? { type: "redirect", redirect: { extensionPath: FOCUS_PAGE } } : { type: "block" },
  condition: { urlFilter, resourceTypes: ["main_frame"] },
});

/**
 * Pick the action per filter. Redirect needs host access to the request URL (Chrome); block does not.
 * So a granted filter redirects and an ungranted one falls back to block. Duplicate filters are merged,
 * and any granted entry wins.
 */
export const planRules = (entries: { urlFilter: string; granted: boolean }[]): DesiredRule[] => {
  const byFilter = new Map<string, boolean>();
  for (const { urlFilter, granted } of entries) {
    byFilter.set(urlFilter, (byFilter.get(urlFilter) ?? false) || granted);
  }
  return [...byFilter].map(([urlFilter, granted]) => ({ urlFilter, action: granted ? "redirect" : "block" }));
};

/**
 * Compute the minimal update to turn the existing dynamic rules into the desired set.
 * Rules already matching a desired filter and action are kept; duplicates and stale
 * rules (including ones whose action changed) are removed; missing ones are added with unused ids.
 */
export const diffRules = (existing: ExistingRule[], desired: DesiredRule[]): RuleDiff => {
  const wanted = new Map<string, RuleAction>();
  for (const d of desired) wanted.set(d.urlFilter, d.action);
  const kept = new Set<string>();
  const removeRuleIds: number[] = [];
  const usedIds = new Set<number>();

  for (const rule of existing) {
    const filter = rule.condition.urlFilter;
    const type = rule.action?.type;
    if (filter !== undefined && wanted.get(filter) === type && !kept.has(filter)) {
      kept.add(filter);
      usedIds.add(rule.id);
    } else {
      removeRuleIds.push(rule.id);
    }
  }

  const addRules: DnrRule[] = [];
  let nextId = 1;
  for (const [filter, action] of wanted) {
    if (kept.has(filter)) continue;
    while (usedIds.has(nextId)) nextId++;
    usedIds.add(nextId);
    addRules.push(buildRule(nextId, filter, action));
  }
  return { removeRuleIds, addRules };
};

/** Origins that can be released after removing a rule: those no remaining rule still needs. */
export const releasableOrigins = (removedOrigins: string[], remainingOrigins: string[][]): string[] => {
  const needed = new Set(remainingOrigins.flat());
  return removedOrigins.filter((o) => !needed.has(o));
};
