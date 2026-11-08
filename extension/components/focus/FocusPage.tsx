import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Play } from "lucide-react";
import type { FC } from "react";
import { browser } from "wxt/browser";
import { useNow } from "@/components/hooks/useNow";
import { useSettings, useStoredState } from "@/components/hooks/useSettings";
import { CategoryBadge } from "@/components/popup/CategoryBadge";
import { buttonVariants } from "@/components/ui/button";
import { formatElapsed } from "@/lib/badge";
import { getLastNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";
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
  const blockedUrl = useBlockedUrl();

  const session = state.data?.activeSession ?? null;
  const appUrl = webAppUrl(settings.data?.apiBase ?? DEFAULT_API_BASE);
  const host = blockedUrl.data ? new URL(blockedUrl.data).hostname : null;
  const siteName = host ?? "This site";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <img src="/icon/32.png" alt="" className="h-6 w-6" />
        Nowaster
      </div>

      {session ? (
        <section
          className="w-full rounded-xl p-8 text-white shadow-lg"
          style={{ background: "var(--gradient-primary)" }}
        >
          <p className="text-xs uppercase tracking-wide text-white/80">Blocked during your session</p>
          <h1 className="mt-3 break-all text-xl font-semibold">{siteName}</h1>
          {session.category ? (
            <div className="mt-4 flex justify-center">
              <CategoryBadge name={session.category.name} color={session.category.color} className="bg-black/40" />
            </div>
          ) : null}
          <p className="mt-5 text-5xl font-semibold tabular-nums">
            {formatElapsed(now - Date.parse(session.startTime))}
          </p>
          <p className="mt-4 text-sm text-white/80">Stay focused. This site opens again when the session ends.</p>
        </section>
      ) : (
        <section className="w-full rounded-xl border bg-card p-8 text-card-foreground shadow-lg">
          <h1 className="text-xl font-semibold">Session ended</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {host ? `${host} is no longer blocked.` : "The site you were visiting is no longer blocked."}
          </p>
          {blockedUrl.data && host ? (
            <a href={blockedUrl.data} className={cn(buttonVariants({ className: "mt-6 w-full" }))}>
              <Play className="h-4 w-4" />
              Continue to {host}
            </a>
          ) : null}
        </section>
      )}

      <a
        href={appUrl}
        className={cn(buttonVariants({ variant: "outline", className: "w-full" }))}
      >
        <ExternalLink className="h-4 w-4" />
        Open Nowaster
      </a>
    </main>
  );
};
