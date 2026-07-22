"use client";

import type { AvatarHistoryEntry } from "@/api/definitions/models/avatar";
import { useAvatarHistory } from "@/components/hooks/avatar/useAvatarHistory";
import { AvatarDialog } from "@/components/ui-providers/avatar/AvatarDialog";
import { Skeleton } from "@/components/shadcn/skeleton";
import { format } from "date-fns";
import Image from "next/image";
import { type FC, useState } from "react";

const HistoryTile: FC<{ entry: AvatarHistoryEntry; onClick: () => void; }> = ({
  entry,
  onClick,
}) => (
  <button
    className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
    onClick={onClick}
    type="button"
  >
    <Image
      alt="Past avatar"
      className="object-cover transition-opacity group-hover:opacity-80"
      fill
      sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 12.5vw"
      src={entry.thumbUrl}
      unoptimized
    />
    <span className="absolute inset-x-0 bottom-0 bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
      {format(entry.generatedAt, "MMM d, yyyy")}
    </span>
  </button>
);

export const AvatarHistoryGallery: FC = () => {
  const { data: history, isLoading } = useAvatarHistory();
  const [selectedIndex, setSelectedIndex] = useState<null | number>(null);

  if (!isLoading && (!history || history.length === 0)) {
    return null;
  }

  const selected
    = selectedIndex === null ? undefined : history?.[selectedIndex];

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Past avatars</h2>
        <p className="text-sm text-muted-foreground">
          Every version generated so far.
        </p>
      </div>

      {isLoading
        ? (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton className="aspect-square w-full rounded-lg" key={i} />
              ))}
            </div>
          )
        : (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
              {history?.map((entry, i) => (
                <HistoryTile
                  entry={entry}
                  key={entry.id}
                  onClick={() => setSelectedIndex(i)}
                />
              ))}
            </div>
          )}

      {selected && (
        <AvatarDialog
          imageUrl={selected.imageUrl}
          onNext={
            selectedIndex !== null && selectedIndex < (history?.length ?? 0) - 1
              ? () => setSelectedIndex(selectedIndex + 1)
              : undefined
          }
          onOpenChange={(open) => !open && setSelectedIndex(null)}
          onPrevious={
            selectedIndex !== null && selectedIndex > 0
              ? () => setSelectedIndex(selectedIndex - 1)
              : undefined
          }
          open={selectedIndex !== null}
        />
      )}
    </div>
  );
};
