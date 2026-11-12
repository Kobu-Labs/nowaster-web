import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, finishSession } from "@/lib/api";

const settings = { token: "t", apiBase: "https://x.test/api" };

const stubFetch = (status: number, body: unknown) => {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fn);
  return fn;
};

afterEach(() => vi.unstubAllGlobals());

describe("finishSession", () => {
  it("posts the end time to the finish endpoint and returns the fixed session", async () => {
    const fixed = { id: "f1", startTime: "2026-01-01T00:00:00Z", endTime: "2026-01-01T01:00:00Z" };
    const fn = stubFetch(200, { status: "success", data: fixed });
    const result = await finishSession(settings, "abc", "2026-01-01T01:00:00Z");
    expect(result).toEqual(fixed);
    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://x.test/api/session/stopwatch/abc/finish");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ endTime: "2026-01-01T01:00:00Z" });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("treats 404 as already stopped", async () => {
    stubFetch(404, { status: "error", message: "not found" });
    await expect(finishSession(settings, "abc", "2026-01-01T01:00:00Z")).resolves.toBeNull();
  });

  it("rethrows other errors so the session stays active", async () => {
    stubFetch(500, { status: "error", message: "boom" });
    const err = await finishSession(settings, "abc", "2026-01-01T01:00:00Z").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(500);
  });
});
