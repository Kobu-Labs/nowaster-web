import { browser } from "wxt/browser";
import { STATE_KEYS } from "@/lib/storage";
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

  // Granting or revoking site access switches rules between redirect and block.
  browser.permissions.onAdded.addListener(() => void applyState());
  browser.permissions.onRemoved.addListener(() => void applyState());

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (STATE_KEYS.some((key) => key in changes)) void applyState();
  });
});
