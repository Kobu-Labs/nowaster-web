import { browser } from "wxt/browser";
import { formatBadge } from "@/lib/badge";
import * as api from "@/lib/api";
import { patternToUrlFilter, urlMatchesFilter } from "@/lib/pattern";
import { diffRules } from "@/lib/rules";
import { getSettings, getState, setActiveSession, setBlockPatterns } from "@/lib/storage";
import type { Settings } from "@/lib/types";

export const TICK_ALARM = "nowaster-tick";

/**
 * Make the browser match stored state: DNR rules, badge text and the tick alarm.
 * Idempotent, so it is safe to call on every service-worker wake.
 */
export const applyState = async (): Promise<void> => {
  const { activeSession, blockPatterns } = await getState();

  // Host access is granted at install (<all_urls>), so every block pattern redirects to the focus page.
  const filters = activeSession
    ? blockPatterns.map(patternToUrlFilter).filter((f): f is string => f !== null)
    : [];
  const existing = await browser.declarativeNetRequest.getDynamicRules();
  const { removeRuleIds, addRules } = diffRules(existing, filters);
  if (removeRuleIds.length > 0 || addRules.length > 0) {
    await browser.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules: addRules as Parameters<typeof browser.declarativeNetRequest.updateDynamicRules>[0]["addRules"],
    });
  }

  if (activeSession) {
    await browser.action.setBadgeText({ text: formatBadge(Date.now() - Date.parse(activeSession.startTime)) });
    await browser.action.setBadgeBackgroundColor({ color: "#b82e8a" });
    if (!(await browser.alarms.get(TICK_ALARM))) {
      await browser.alarms.create(TICK_ALARM, { periodInMinutes: 1 });
    }
  } else {
    await browser.action.setBadgeText({ text: "" });
    await browser.alarms.clear(TICK_ALARM);
  }
};

/** Pull the active session and block list from the API into storage. Throws on failure. */
export const pullFromApi = async (settings: Settings): Promise<void> => {
  const session = await api.getActiveSession(settings);
  await setActiveSession(session ?? null);
  const rules = await api.listBlockRules(settings);
  await setBlockPatterns(rules.map((r) => r.pattern));
};

/** Background refresh. Offline keeps the old state; a rejected token clears the active session. */
export const refreshFromApi = async (): Promise<void> => {
  const settings = await getSettings();
  if (!settings.token) {
    await setActiveSession(null);
    return;
  }
  try {
    await pullFromApi(settings);
  } catch (error) {
    if (error instanceof api.ApiError && error.status === 401) await setActiveSession(null);
  }
};

/** Reload open tabs that match the block list, so the redirect rules apply to them. Returns how many were reloaded. */
export const reloadBlockedTabs = async (): Promise<number> => {
  const { blockPatterns } = await getState();
  const filters = blockPatterns.map(patternToUrlFilter).filter((f): f is string => f !== null);
  if (filters.length === 0) return 0;
  const tabs = await browser.tabs.query({});
  let reloaded = 0;
  for (const tab of tabs) {
    if (tab.id === undefined || !tab.url) continue;
    const url = tab.url;
    if (!filters.some((f) => urlMatchesFilter(url, f))) continue;
    await browser.tabs.reload(tab.id).catch(() => undefined);
    reloaded++;
  }
  return reloaded;
};
