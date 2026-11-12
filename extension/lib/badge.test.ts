import { describe, expect, it } from "vitest";
import { formatBadge, formatElapsed } from "@/lib/badge";

const min = 60_000;

describe("formatBadge", () => {
  it("shows minutes under an hour", () => {
    expect(formatBadge(0)).toBe("0m");
    expect(formatBadge(45 * min + 5000)).toBe("45m");
    expect(formatBadge(59 * min)).toBe("59m");
  });
  it("shows h + padded minutes from one hour", () => {
    expect(formatBadge(60 * min)).toBe("1h00");
    expect(formatBadge(65 * min)).toBe("1h05");
    expect(formatBadge(9 * 60 * min + 59 * min)).toBe("9h59");
  });
  it("collapses to hours when 4 chars would be exceeded", () => {
    expect(formatBadge(10 * 60 * min)).toBe("10h");
    expect(formatBadge(100 * 60 * min)).toBe("99h+");
  });
  it("never exceeds 4 characters and clamps negatives", () => {
    expect(formatBadge(-5)).toBe("0m");
    for (let h = 0; h < 200; h++) expect(formatBadge(h * 60 * min + 59 * min).length).toBeLessThanOrEqual(4);
  });
});

describe("formatElapsed", () => {
  it("formats mm:ss and h:mm:ss", () => {
    expect(formatElapsed(9_000)).toBe("00:09");
    expect(formatElapsed(3_909_000)).toBe("1:05:09");
  });
});
