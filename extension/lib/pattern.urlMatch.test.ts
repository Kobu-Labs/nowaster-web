import { describe, expect, it } from "vitest";
import { urlMatchesFilter } from "@/lib/pattern";

describe("urlMatchesFilter", () => {
  it("matches the domain and its subdomains", () => {
    expect(urlMatchesFilter("https://example.com/a", "||example.com")).toBe(true);
    expect(urlMatchesFilter("https://www.example.com/", "||example.com")).toBe(true);
  });

  it("does not match look-alike domains", () => {
    expect(urlMatchesFilter("https://notexample.com/", "||example.com")).toBe(false);
    expect(urlMatchesFilter("https://example.com.evil.net/", "||example.com")).toBe(false);
  });

  it("applies a path prefix when the filter has one", () => {
    expect(urlMatchesFilter("https://reddit.com/r/all/top", "||reddit.com/r/all")).toBe(true);
    expect(urlMatchesFilter("https://reddit.com/r/programming", "||reddit.com/r/all")).toBe(false);
  });

  it("ignores non-web and invalid URLs", () => {
    expect(urlMatchesFilter("chrome://newtab/", "||example.com")).toBe(false);
    expect(urlMatchesFilter("not a url", "||example.com")).toBe(false);
  });
});
