import type { BlockRule, Category, CurrentUser, Settings, StopwatchSession, Tag } from "@/lib/types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Envelope<T> = { status: "success"; data: T } | { status: string; message?: string };

/** `path` is relative to the configured base URL, which already ends in /api. */
const request = async <T>(settings: Settings, path: string, init: RequestInit = {}): Promise<T> => {
  if (!settings.token) throw new ApiError("No API token configured", 0);
  const headers: Record<string, string> = { "X-API-Key": settings.token, Accept: "application/json" };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${settings.apiBase}${path}`, { ...init, headers });
  const text = await res.text();
  let body: Envelope<T> | null;
  try {
    body = text ? (JSON.parse(text) as Envelope<T>) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    const msg = body && "message" in body && body.message ? body.message : res.statusText;
    throw new ApiError(res.status === 401 ? "Unauthorized: token rejected" : msg || `HTTP ${res.status}`, res.status);
  }
  if (body && body.status !== "success") {
    throw new ApiError("message" in body && body.message ? body.message : "Request failed", res.status);
  }
  return (body && "data" in body ? body.data : undefined) as T;
};

const byLastUsed = <T extends { last_used_at?: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => Date.parse(b.last_used_at ?? "") - Date.parse(a.last_used_at ?? "") || 0);

export const getMe = (s: Settings) => request<CurrentUser>(s, "/auth/me");

export const getCategories = async (s: Settings) => byLastUsed(await request<Category[]>(s, "/category"));
export const getTags = async (s: Settings) => byLastUsed(await request<Tag[]>(s, "/tag"));

export const createCategory = (s: Settings, input: { name: string; color: string }) =>
  request<Category>(s, "/category", { method: "POST", body: JSON.stringify(input) });

/** A new tag with no category restriction, so it can be used with any category. */
export const createTag = (s: Settings, input: { label: string; color: string }) =>
  request<Tag>(s, "/tag", { method: "POST", body: JSON.stringify({ ...input, allowedCategories: [] }) });

export const getActiveSession = (s: Settings) => request<StopwatchSession | null>(s, "/session/stopwatch");

export const startSession = (
  s: Settings,
  input: { category: Category; tagIds: string[]; description?: string },
) =>
  request<StopwatchSession>(s, "/session/stopwatch", {
    method: "POST",
    body: JSON.stringify({
      category: { name: input.category.name, color: input.category.color },
      tags: input.tagIds.map((id) => ({ id })),
      description: input.description?.trim() || null,
      startTime: new Date().toISOString(),
    }),
  });

/** Fixed session created by finishing a stopwatch (only the fields the extension reads). */
export type FinishedSession = { id: string; startTime: string; endTime: string };

/**
 * Finish a stopwatch in one call: `POST /session/stopwatch/{id}/finish`.
 * Returns the created fixed session, or null on 404 (the stopwatch is already gone, for
 * example stopped in the web app). Any other failure is thrown so the caller can retry.
 */
export const finishSession = async (s: Settings, id: string, endTime: string): Promise<FinishedSession | null> => {
  try {
    return await request<FinishedSession>(s, `/session/stopwatch/${id}/finish`, {
      method: "POST",
      body: JSON.stringify({ endTime }),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
};

/** Delete a running stopwatch without saving it. A 404 means it is already gone, which counts as discarded. */
export const discardSession = async (s: Settings, id: string): Promise<void> => {
  try {
    await request<null>(s, `/session/stopwatch/${id}`, { method: "DELETE" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return;
    throw error;
  }
};

export const listBlockRules = (s: Settings) => request<BlockRule[]>(s, "/block-rules");
export const createBlockRule = (s: Settings, pattern: string) =>
  request<BlockRule>(s, "/block-rules", { method: "POST", body: JSON.stringify({ pattern }) });
export const deleteBlockRule = (s: Settings, id: string) =>
  request<null>(s, `/block-rules/${id}`, { method: "DELETE" });
