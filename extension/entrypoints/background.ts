import { browser } from "wxt/browser";
import { STATE_KEYS } from "@/lib/storage";
import { forgetNavigation, rememberNavigation } from "@/lib/navigation";
import { applyState, refreshFromApi, TICK_ALARM } from "@/lib/sync";

export default defineBackground(() => {
  // MV3 workers are ephemeral: all state lives in storage, and every wake re-applies it.
  void applyState();

  browser.runtime.onInstalled.addListener(() => {
    void refreshFromApi().then(applyState);
  });
  browser.runtime.onStartup.addListener(() => {
    void refreshFromApi().then(applyState);
  });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== TICK_ALARM) return;
    void refreshFromApi().then(applyState);
  });

  // Fires before the block rule redirects, so the focus page can offer the original address.
  browser.webNavigation.onBeforeNavigate.addListener((details) => {
    if (details.frameId === 0) void rememberNavigation(details.tabId, details.url);
  });
  browser.tabs.onRemoved.addListener((tabId) => void forgetNavigation(tabId));

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (STATE_KEYS.some((key) => key in changes)) void applyState();
  });
});
