import { describe, expect, it } from "vitest";
import { buildRule, diffRules, planRules, releasableOrigins } from "@/lib/rules";
import { originsForHost, patternHost } from "@/lib/pattern";

const redirect = (filter: string) => ({ urlFilter: filter, action: "redirect" as const });
const block = (filter: string) => ({ urlFilter: filter, action: "block" as const });

describe("planRules", () => {
  it("redirects when access is granted", () => {
    expect(planRules([{ urlFilter: "||a.com", granted: true }])).toEqual([redirect("||a.com")]);
  });

  it("falls back to block when access is not granted", () => {
    expect(planRules([{ urlFilter: "||a.com", granted: false }])).toEqual([block("||a.com")]);
  });

  it("handles mixed sets without failing the whole set", () => {
    expect(
      planRules([
        { urlFilter: "||a.com", granted: true },
        { urlFilter: "||b.com", granted: false },
        { urlFilter: "||c.com", granted: true },
      ]),
    ).toEqual([redirect("||a.com"), block("||b.com"), redirect("||c.com")]);
  });

  it("merges duplicate filters, granted wins", () => {
    expect(
      planRules([
        { urlFilter: "||a.com", granted: false },
        { urlFilter: "||a.com", granted: true },
      ]),
    ).toEqual([redirect("||a.com")]);
  });
});

describe("diffRules", () => {
  it("adds all rules when none exist, with the right actions", () => {
    const diff = diffRules([], [redirect("||a.com"), block("||b.com")]);
    expect(diff.removeRuleIds).toEqual([]);
    expect(diff.addRules.map((r) => [r.id, r.condition.urlFilter, r.action.type])).toEqual([
      [1, "||a.com", "redirect"],
      [2, "||b.com", "block"],
    ]);
    expect(diff.addRules[0]?.action).toEqual({ type: "redirect", redirect: { extensionPath: "/focus.html" } });
    expect(diff.addRules[1]?.action).toEqual({ type: "block" });
  });

  it("removes everything when nothing is desired", () => {
    const diff = diffRules([buildRule(1, "||a.com"), buildRule(2, "||b.com", "block")], []);
    expect(diff.removeRuleIds).toEqual([1, 2]);
    expect(diff.addRules).toEqual([]);
  });

  it("keeps matching rules and avoids reusing ids", () => {
    const diff = diffRules(
      [buildRule(1, "||a.com"), buildRule(2, "||old.com")],
      [redirect("||a.com"), redirect("||new.com")],
    );
    expect(diff.removeRuleIds).toEqual([2]);
    expect(diff.addRules.map((r) => r.id)).toEqual([2]);
    expect(diff.addRules[0]?.condition.urlFilter).toBe("||new.com");
  });

  it("replaces a rule whose action changed (access granted or revoked)", () => {
    const diff = diffRules([buildRule(1, "||a.com", "block"), buildRule(2, "||b.com")], [redirect("||a.com"), block("||b.com")]);
    expect(diff.removeRuleIds).toEqual([1, 2]);
    expect(diff.addRules.map((r) => [r.condition.urlFilter, r.action.type])).toEqual([
      ["||a.com", "redirect"],
      ["||b.com", "block"],
    ]);
  });

  it("dedupes desired filters and removes duplicate existing rules", () => {
    const diff = diffRules([buildRule(1, "||a.com"), buildRule(2, "||a.com")], [redirect("||a.com"), redirect("||a.com")]);
    expect(diff.removeRuleIds).toEqual([2]);
    expect(diff.addRules).toEqual([]);
  });
});

describe("origins", () => {
  it("derives the host and match patterns from a block pattern", () => {
    expect(patternHost("https://Reddit.com/r/all")).toBe("reddit.com");
    expect(patternHost("example.com:8080")).toBe("example.com");
    expect(patternHost("*.com")).toBeNull();
    expect(originsForHost("example.com")).toEqual(["*://*.example.com/*", "*://example.com/*"]);
  });

  it("releases origins only when no other rule needs them", () => {
    const a = originsForHost("a.com");
    const b = originsForHost("b.com");
    expect(releasableOrigins(a, [b])).toEqual(a);
    expect(releasableOrigins(a, [a, b])).toEqual([]);
  });
});
