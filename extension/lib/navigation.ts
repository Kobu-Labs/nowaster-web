import { browser } from "wxt/browser";

const key = (tabId: number) => `lastNavigation:${tabId}`;

/** Remember the last http(s) main-frame URL a tab navigated to, so the focus page can offer to return to it. */
export const rememberNavigation = async (tabId: number, url: string): Promise<void> => {
  if (!/^https?:\/\//.test(url)) return;
  await browser.storage.session.set({ [key(tabId)]: url });
};

export const forgetNavigation = async (tabId: number): Promise<void> => {
  await browser.storage.session.remove(key(tabId));
};

export const getLastNavigation = async (tabId: number): Promise<string | null> => {
  const r = await browser.storage.session.get(key(tabId));
  const url = r[key(tabId)];
  return typeof url === "string" ? url : null;
};
