import { describe, expect, it } from "vitest";
import { patternToUrlFilter } from "@/lib/pattern";

describe("patternToUrlFilter", () => {
  it("prefixes a bare domain", () => {
    expect(patternToUrlFilter("example.com")).toBe("||example.com");
  });
  it("strips protocol, trailing slash, case and whitespace", () => {
    expect(patternToUrlFilter("  HTTPS://Example.com/ ")).toBe("||example.com");
  });
  it("keeps paths", () => {
    expect(patternToUrlFilter("reddit.com/r/all")).toBe("||reddit.com/r/all");
  });
  it("does not double the prefix", () => {
    expect(patternToUrlFilter("||example.com")).toBe("||example.com");
  });
  it("rejects empty and unsafe input", () => {
    expect(patternToUrlFilter("   ")).toBeNull();
    expect(patternToUrlFilter("a b.com")).toBeNull();
    expect(patternToUrlFilter("*.com")).toBeNull();
  });
});
