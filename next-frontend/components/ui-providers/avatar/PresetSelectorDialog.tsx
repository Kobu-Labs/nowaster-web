"use client";

import type { AvatarPreset } from "@/api/definitions/models/avatar";
import { usePresets } from "@/components/hooks/avatar/usePresets";
import { useSetPreset } from "@/components/hooks/avatar/useSetPreset";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Skeleton } from "@/components/shadcn/skeleton";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Image from "next/image";
import { type FC } from "react";

type Props = {
  currentPresetId: null | string;
  onOpenChange: (open: boolean) => void;
  onSelected?: () => void;
  open: boolean;
};

const PresetTile: FC<{
  isPending: boolean;
  onSelect: (id: string) => void;
  preset: AvatarPreset;
  selected: boolean;
}> = ({ isPending, onSelect, preset, selected }) => (
  <button
    className={cn(
      "relative overflow-hidden rounded-lg border-2 transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      selected ? "border-primary" : "border-transparent",
    )}
    disabled={isPending}
    onClick={() => onSelect(preset.id)}
    type="button"
  >
    <Image
      alt={preset.name}
      className="aspect-square object-cover"
      height={120}
      src={preset.thumbnailUrl}
      unoptimized
      width={120}
    />
    {selected && (
      <div className="absolute right-1 top-1 rounded-full bg-primary p-0.5">
        <Check className="h-3 w-3 text-primary-foreground" />
      </div>
    )}
    <p className="truncate p-1 text-center text-xs">{preset.name}</p>
  </button>
);

export const PresetSelectorDialog: FC<Props> = ({
  currentPresetId,
  onOpenChange,
  onSelected,
  open,
}) => {
  const { data: presets, isLoading } = usePresets();
  const setPreset = useSetPreset();

  const handleSelect = async (presetId: string) => {
    await setPreset.mutateAsync(presetId);
    onOpenChange(false);
    onSelected?.();
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose your default avatar</DialogTitle>
          <DialogDescription>
            This is the character your avatar is based on — their face,
            body, and pose always stay the same. The scene around them
            changes automatically based on what you track.
          </DialogDescription>
        </DialogHeader>
        {isLoading
          ? (
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton className="h-[148px] w-full rounded-lg" key={i} />
                ))}
              </div>
            )
          : (
              <div className="grid grid-cols-3 gap-3">
                {presets?.map((preset) => (
                  <PresetTile
                    isPending={setPreset.isPending}
                    key={preset.id}
                    onSelect={handleSelect}
                    preset={preset}
                    selected={preset.id === currentPresetId}
                  />
                ))}
              </div>
            )}
      </DialogContent>
    </Dialog>
  );
};
