"use client";

import { useTrackedCategories } from "@/components/hooks/community/useTrackedCategories";
import { useCreateTrackedCategory } from "@/components/hooks/community/useCreateTrackedCategory";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Skeleton } from "@/components/shadcn/skeleton";
import { ColorPicker } from "@/components/visualizers/ColorPicker";
import { TrackedCategoryChip } from "@/components/visualizers/communities/TrackedCategoryChip";
import { randomColor } from "@/lib/utils";
import { Plus } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";

type TrackedCategoryManagerProps = {
  communityId: string;
  isOwner: boolean;
};

export const TrackedCategoryManager: FC<TrackedCategoryManagerProps> = ({
  communityId,
  isOwner,
}) => {
  const query = useTrackedCategories(communityId);
  const createTrackedCategory = useCreateTrackedCategory();
  const [name, setName] = useState("");
  const [color, setColor] = useState(randomColor());

  const handleAdd = () => {
    if (!name.trim()) {
      return;
    }
    createTrackedCategory.mutate(
      { communityId, name: name.trim(), color },
      {
        onSuccess: () => {
          setName("");
          setColor(randomColor());
        },
      },
    );
  };

  if (query.isPending) {
    return (
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    );
  }

  const trackedCategories = query.data ?? [];

  return (
    <div className="space-y-4">
      {trackedCategories.length === 0 && !isOwner && (
        <div className="text-center py-6">
          <p className="font-medium">
            This community hasn&apos;t set up tracked categories yet
          </p>
          <p className="text-muted-foreground text-sm">
            Once the owner adds some, you&apos;ll be able to connect your own
            categories to them.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {trackedCategories.map((trackedCategory) => (
          <TrackedCategoryChip
            communityId={communityId}
            editable={isOwner}
            key={trackedCategory.id}
            trackedCategory={trackedCategory}
          />
        ))}
      </div>

      {isOwner && (
        <div className="flex items-center gap-2">
          <ColorPicker initialColor={color} onSelect={setColor} />
          <Input
            className="max-w-xs"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAdd();
              }
            }}
            placeholder={
              trackedCategories.length === 0
                ? "Add your first tracked category, e.g. \"Algorithms\" or \"Weekly Standup\""
                : "New tracked category name..."
            }
            value={name}
          />
          <Button
            disabled={createTrackedCategory.isPending || !name.trim()}
            loading={createTrackedCategory.isPending}
            onClick={handleAdd}
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
};
