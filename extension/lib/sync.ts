import { browser } from "wxt/browser";
import { formatBadge } from "@/lib/badge";
import * as api from "@/lib/api";
import { originsForHost, patternHost, patternToUrlFilter } from "@/lib/pattern";
import { diffRules, planRules } from "@/lib/rules";
import { getSettings, getState, setActiveSession, setBlockPatterns } from "@/lib/storage";

export const TICK_ALARM = "nowaster-tick";

/**
 * Make the browser match stored state: DNR rules, badge text and the tick alarm.
 * Idempotent, so it is safe to call on every service-worker wake.
 */
export const applyState = async (): Promise<void> => {
  const { activeSession, blockPatterns } = await getState();

  // Redirect needs host access to the request URL; block does not. Rules without access get block.
  const entries = activeSession
    ? await Promise.all(
        blockPatterns.map(async (pattern) => {
          const urlFilter = patternToUrlFilter(pattern);
          const host = patternHost(pattern);
          if (!urlFilter || !host) return null;
          const granted = await browser.permissions
            .contains({ origins: originsForHost(host) })
            .catch(() => false);
          return { urlFilter, granted };
        }),
      )
    : [];
  const desired = planRules(entries.filter((e) => e !== null));
  const existing = await browser.declarativeNetRequest.getDynamicRules();
  const { removeRuleIds, addRules } = diffRules(existing, desired);
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

/** Pull the active session and block list from the API into storage. Offline keeps old state. */
export const refreshFromApi = async (): Promise<void> => {
  const settings = await getSettings();
  if (!settings.token) {
    await setActiveSession(null);
    return;
  }
  try {
    const session = await api.getActiveSession(settings);
    await setActiveSession(session ?? null);
    const rules = await api.listBlockRules(settings);
    await setBlockPatterns(rules.map((r) => r.pattern));
  } catch (error) {
    if (error instanceof api.ApiError && error.status === 401) await setActiveSession(null);
  }
};
