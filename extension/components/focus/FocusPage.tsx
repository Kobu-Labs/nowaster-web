import type { FC } from "react";
import { useNow } from "@/components/hooks/useNow";
import { useSettings, useStoredState } from "@/components/hooks/useSettings";
import { formatElapsed } from "@/lib/badge";
import { DEFAULT_API_BASE, webAppUrl } from "@/lib/storage";

export const FocusPage: FC = () => {
  const now = useNow();
  const state = useStoredState();
  const settings = useSettings();
  const session = state.data?.activeSession ?? null;
  const appUrl = webAppUrl(settings.data?.apiBase ?? DEFAULT_API_BASE);

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
          <p className="mt-2 text-muted-foreground">You can go back to the site you were visiting.</p>
        </section>
      )}
      <a className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground" href={appUrl}>
        Open Nowaster
      </a>
    </main>
  );
};
