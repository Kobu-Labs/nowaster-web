import { describe, expect, it } from "vitest";
import { buildRule, diffRules } from "@/lib/rules";

describe("diffRules", () => {
  it("adds one redirect rule per filter when none exist", () => {
    const diff = diffRules([], ["||a.com", "||b.com"]);
    expect(diff.removeRuleIds).toEqual([]);
    expect(diff.addRules.map((r) => [r.id, r.condition.urlFilter, r.action.type])).toEqual([
      [1, "||a.com", "redirect"],
      [2, "||b.com", "redirect"],
    ]);
    expect(diff.addRules[0]?.action).toEqual({ type: "redirect", redirect: { extensionPath: "/focus.html" } });
  });

  it("removes everything when nothing is desired", () => {
    const diff = diffRules([buildRule(1, "||a.com"), buildRule(2, "||b.com")], []);
    expect(diff.removeRuleIds).toEqual([1, 2]);
    expect(diff.addRules).toEqual([]);
  });

  it("keeps matching rules and avoids reusing ids", () => {
    const diff = diffRules([buildRule(1, "||a.com"), buildRule(2, "||old.com")], ["||a.com", "||new.com"]);
    expect(diff.removeRuleIds).toEqual([2]);
    expect(diff.addRules.map((r) => r.id)).toEqual([2]);
    expect(diff.addRules[0]?.condition.urlFilter).toBe("||new.com");
  });

  it("replaces a rule that is not a redirect", () => {
    const stale = { id: 1, action: { type: "block" }, condition: { urlFilter: "||a.com" } };
    const diff = diffRules([stale], ["||a.com"]);
    expect(diff.removeRuleIds).toEqual([1]);
    expect(diff.addRules.map((r) => [r.id, r.action.type])).toEqual([[1, "redirect"]]);
  });

  it("dedupes desired filters and removes duplicate existing rules", () => {
    const diff = diffRules([buildRule(1, "||a.com"), buildRule(2, "||a.com")], ["||a.com", "||a.com"]);
    expect(diff.removeRuleIds).toEqual([2]);
    expect(diff.addRules).toEqual([]);
  });
});
