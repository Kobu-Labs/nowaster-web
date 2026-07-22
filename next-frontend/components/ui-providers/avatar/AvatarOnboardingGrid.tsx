"use client";

import { usePresets } from "@/components/hooks/avatar/usePresets";
import { PresetTile } from "@/components/ui-providers/avatar/PresetSelectorDialog";
import { Skeleton } from "@/components/shadcn/skeleton";
import { type FC } from "react";

type Props = {
  isPending: boolean;
  onSelect: (presetId: string) => void;
};

export const AvatarOnboardingGrid: FC<Props> = ({ isPending, onSelect }) => {
  const { data: presets, isLoading } = usePresets();

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Pick your character to get started. Their face, body, and pose always
        stay the same — the scene around them changes automatically based on
        what you track.
      </p>

      {isLoading
        ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton className="h-[120px] w-full rounded-lg" key={i} />
              ))}
            </div>
          )
        : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {presets?.map((preset) => (
                <PresetTile
                  isPending={isPending}
                  key={preset.id}
                  onSelect={onSelect}
                  preset={preset}
                  selected={false}
                />
              ))}
            </div>
          )}
    </div>
  );
};
