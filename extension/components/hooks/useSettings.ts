import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { browser } from "wxt/browser";
import { getSettings, getState } from "@/lib/storage";

/** Settings from storage, kept fresh when storage changes. */
export const useSettings = () => {
  const queryClient = useQueryClient();
  useEffect(() => {
    const listener = () => {
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
      void queryClient.invalidateQueries({ queryKey: ["state"] });
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, [queryClient]);
  return useQuery({ queryKey: ["settings"], queryFn: getSettings });
};

/** Locally cached active session and block list. */
export const useStoredState = () => useQuery({ queryKey: ["state"], queryFn: getState });
