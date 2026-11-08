import { useQuery } from "@tanstack/react-query";
import type { FC } from "react";
import { browser } from "wxt/browser";
import { useNow } from "@/components/hooks/useNow";
import { useSettings, useStoredState } from "@/components/hooks/useSettings";
import { buttonVariants } from "@/components/ui/button";
import { formatElapsed } from "@/lib/badge";
import { getLastNavigation } from "@/lib/navigation";
import { DEFAULT_API_BASE, webAppUrl } from "@/lib/storage";

/** The address the user was trying to reach in this tab, recorded before the block redirect. */
const useBlockedUrl = () =>
  useQuery({
    queryKey: ["blocked-url"],
    queryFn: async () => {
      const tab = await browser.tabs.getCurrent();
      return tab?.id === undefined ? null : getLastNavigation(tab.id);
    },
  });

export const FocusPage: FC = () => {
  const now = useNow();
  const state = useStoredState();
  const settings = useSettings();
  const session = state.data?.activeSession ?? null;
  const appUrl = webAppUrl(settings.data?.apiBase ?? DEFAULT_API_BASE);
  const blockedUrl = useBlockedUrl();
  const host = blockedUrl.data ? new URL(blockedUrl.data).hostname : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      {session ? (
        <section
          className="w-full rounded-lg p-8 text-white"
          style={{ background: "var(--gradient-primary)" }}
        >
          <p className="text-xs uppercase tracking-wide text-white/80">Site blocked during your session</p>
          <h1 className="mt-3 text-lg font-semibold">{session.category?.name ?? "Session"}</h1>
          <p className="mt-2 text-4xl font-semibold tabular-nums">
            {formatElapsed(now - Date.parse(session.startTime))}
          </p>
        </section>
      ) : (
        <section className="w-full rounded-lg border p-8">
          <h1 className="text-lg font-semibold">No session is running</h1>
          <p className="mt-2 text-muted-foreground">
            {host ? "Your session has ended. You can continue to the site you were visiting." : "You can go back to the site you were visiting."}
          </p>
          {host && blockedUrl.data ? (
            <a href={blockedUrl.data} className={buttonVariants({ className: "mt-4" })}>
              Continue to {host}
            </a>
          ) : null}
        </section>
      )}
      <a className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground" href={appUrl}>
        Open Nowaster
      </a>
    </main>
  );
};
