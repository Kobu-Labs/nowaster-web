import { browser } from "wxt/browser";
import type { Settings, StopwatchSession } from "@/lib/types";

/** Default API. Dev builds talk to the local backend (IPv6 loopback, the port in backend/.env). Overridable in options. */
export const DEFAULT_API_BASE = import.meta.env.DEV ? "http://[::1]:4008/api" : "https://nowaster.app/api";

const KEYS = {
  token: "token",
  apiBase: "apiBase",
  activeSession: "activeSession",
  blockPatterns: "blockPatterns",
} as const;

export type StoredState = {
  activeSession: StopwatchSession | null;
  blockPatterns: string[];
};

const area = () => browser.storage.local;

export const normalizeBase = (value: string): string => value.trim().replace(/\/+$/, "");

export const getSettings = async (): Promise<Settings> => {
  const r = await area().get([KEYS.token, KEYS.apiBase]);
  const token = typeof r[KEYS.token] === "string" ? (r[KEYS.token] as string) : "";
  const base = typeof r[KEYS.apiBase] === "string" ? normalizeBase(r[KEYS.apiBase] as string) : "";
  return { token, apiBase: base || DEFAULT_API_BASE };
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  await area().set({
    [KEYS.token]: settings.token.trim(),
    [KEYS.apiBase]: normalizeBase(settings.apiBase) || DEFAULT_API_BASE,
  });
};

export const getState = async (): Promise<StoredState> => {
  const r = await area().get([KEYS.activeSession, KEYS.blockPatterns]);
  const session = (r[KEYS.activeSession] ?? null) as StopwatchSession | null;
  const patterns = Array.isArray(r[KEYS.blockPatterns]) ? (r[KEYS.blockPatterns] as string[]) : [];
  return { activeSession: session, blockPatterns: patterns };
};

export const setActiveSession = async (session: StopwatchSession | null): Promise<void> => {
  if (session) await area().set({ [KEYS.activeSession]: session });
  else await area().remove(KEYS.activeSession);
};

export const setBlockPatterns = async (patterns: string[]): Promise<void> => {
  await area().set({ [KEYS.blockPatterns]: patterns });
};

export const STATE_KEYS: string[] = [KEYS.activeSession, KEYS.blockPatterns];

/** The web frontend. Dev builds use the local Next.js dev server; the API base is a different origin there. */
export const DEFAULT_WEB_APP_URL = import.meta.env.DEV ? "http://localhost:3000" : "https://nowaster.app";

/**
 * The web app for an API base. The default API maps to the frontend above; a self-hosted API base is
 * assumed to share its origin with the web app, so the trailing /api is dropped.
 */
export const webAppUrl = (apiBase: string): string => {
  const base = normalizeBase(apiBase);
  if (base === DEFAULT_API_BASE) return DEFAULT_WEB_APP_URL;
  // A local dev backend saved in settings still means the Next.js dev server on port 3000.
  if (/^https?:\/\/(\[::1\]|localhost|127\.0\.0\.1):4008(\/|$)/.test(base)) return "http://localhost:3000";
  return base.replace(/\/api$/, "");
};
