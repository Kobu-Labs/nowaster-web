import { useMutation } from "@tanstack/react-query";
import { Square, Trash2 } from "lucide-react";
import { useState } from "react";
import type { FC } from "react";
import { useNow } from "@/components/hooks/useNow";
import { CategoryBadge } from "@/components/popup/CategoryBadge";
import { TagBadge } from "@/components/popup/TagBadge";
import { Button } from "@/components/ui/button";
import * as api from "@/lib/api";
import { formatElapsed } from "@/lib/badge";
import { setActiveSession } from "@/lib/storage";
import type { Settings, StopwatchSession } from "@/lib/types";

type Props = { settings: Settings; session: StopwatchSession };

export const ActiveSessionCard: FC<Props> = ({ settings, session }) => {
  const now = useNow();
  const [confirming, setConfirming] = useState(false);
  const discard = useMutation({
    mutationFn: async () => {
      // Throws before touching local state on failure, so the session stays active.
      await api.discardSession(settings, session.id);
      await setActiveSession(null);
    },
  });
  const stop = useMutation({
    mutationFn: async () => {
      // On failure this throws before touching local state, so the session stays active and Stop can be retried.
      // A 404 (already stopped elsewhere) resolves to null and is treated as stopped.
      await api.finishSession(settings, session.id, new Date().toISOString());
      await setActiveSession(null);
    },
  });

  return (
    <section
      aria-label="Active session"
      className="rounded-lg p-4 text-white"
      style={{ background: "var(--gradient-primary)" }}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/80">
        <span className="h-2 w-2 animate-live rounded-full bg-white" />
        Running
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">
        {formatElapsed(now - Date.parse(session.startTime))}
      </div>
      {session.category ? (
        <div className="mt-2">
          <CategoryBadge name={session.category.name} color={session.category.color} className="bg-black/40" />
        </div>
      ) : (
        <div className="mt-1 text-sm">No category</div>
      )}
      {session.tags && session.tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {session.tags.map((tag) => (
            <TagBadge key={tag.id} label={tag.label} color={tag.color} />
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex gap-2">
        <Button
          variant="secondary"
          className="flex-1 bg-black/30 text-white"
          disabled={stop.isPending || discard.isPending}
          onClick={() => stop.mutate()}
        >
          <Square className="h-4 w-4" />
          {stop.isPending ? "Stopping..." : "Stop"}
        </Button>
        <Button
          variant="destructive"
          size="icon"
          aria-label="Discard session"
          className="h-9 w-9 shrink-0 bg-red-600 text-white hover:bg-red-700"
          disabled={stop.isPending || discard.isPending || confirming}
          onClick={() => setConfirming(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {confirming ? (
        <div className="mt-2 flex flex-col gap-2 text-xs">
          <p>Discard this session? It will not be saved.</p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 bg-black/30 text-white"
              disabled={discard.isPending}
              onClick={() => discard.mutate()}
            >
              {discard.isPending ? "Discarding..." : "Discard"}
            </Button>
            <Button
              variant="secondary"
              className="flex-1 bg-black/30 text-white"
              disabled={discard.isPending}
              onClick={() => setConfirming(false)}
            >
              Keep
            </Button>
          </div>
        </div>
      ) : null}
      {discard.isError ? (
        <p role="alert" className="mt-2 text-xs">
          Could not discard the session: {discard.error.message}. It is still running; try again.
        </p>
      ) : null}
      {stop.isError ? (
        <p role="alert" className="mt-2 text-xs">
          Could not stop the session: {stop.error.message}. It is still running; try again.
        </p>
      ) : null}
    </section>
  );
};
