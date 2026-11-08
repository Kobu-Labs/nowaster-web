import { browser } from "wxt/browser";
import type { Settings, StopwatchSession } from "@/lib/types";

/** Production API. Dev builds talk to the local backend (IPv6 loopback, the port in backend/.env). */
export const DEFAULT_API_BASE = import.meta.env.DEV ? "http://[::1]:4008/api" : "https://nowaster.app/api";

const KEYS = {
  token: "token",
  activeSession: "activeSession",
  blockPatterns: "blockPatterns",
} as const;

export type StoredState = {
  activeSession: StopwatchSession | null;
  blockPatterns: string[];
};

const area = () => browser.storage.local;

export const normalizeBase = (value: string): string => value.trim().replace(/\/+$/, "");

/** The API base is a build-time constant, so any value saved by an older version is ignored. */
export const getSettings = async (): Promise<Settings> => {
  const r = await area().get([KEYS.token]);
  const token = typeof r[KEYS.token] === "string" ? (r[KEYS.token] as string) : "";
  return { token, apiBase: DEFAULT_API_BASE };
};

export const saveToken = async (token: string): Promise<void> => {
  await area().set({ [KEYS.token]: token.trim() });
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

/** The web app lives at the API origin without the trailing /api segment. */
export const webAppUrl = (apiBase: string): string => normalizeBase(apiBase).replace(/\/api$/, "");
