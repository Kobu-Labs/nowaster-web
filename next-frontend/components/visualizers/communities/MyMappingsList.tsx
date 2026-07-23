"use client";

import type { CategoryWithId, TrackedCategory } from "@/api/definitions";
import { useMyMappings } from "@/components/hooks/community/useMyMappings";
import { useTrackedCategories } from "@/components/hooks/community/useTrackedCategories";
import { useCreateMapping } from "@/components/hooks/community/useCreateMapping";
import { useDeleteMapping } from "@/components/hooks/community/useDeleteMapping";
import { Button } from "@/components/shadcn/button";
import { Card, CardContent } from "@/components/shadcn/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { Skeleton } from "@/components/shadcn/skeleton";
import { CategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import { ArrowRight, Plus, X } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";

type MyMappingsListProps = {
  communityId: string;
};

export const MyMappingsList: FC<MyMappingsListProps> = ({ communityId }) => {
  const mappingsQuery = useMyMappings(communityId);
  const trackedCategoriesQuery = useTrackedCategories(communityId);
  const createMapping = useCreateMapping();
  const deleteMapping = useDeleteMapping();

  const [adding, setAdding] = useState(false);
  const [selectedTrackedCategory, setSelectedTrackedCategory]
    = useState<null | TrackedCategory>(null);

  if (mappingsQuery.isPending || trackedCategoriesQuery.isPending) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const mappings = mappingsQuery.data ?? [];
  const trackedCategories = trackedCategoriesQuery.data ?? [];

  const handleSelectPersonalCategory = (personalCategory: CategoryWithId) => {
    if (!selectedTrackedCategory) {
      return;
    }
    createMapping.mutate({
      communityId,
      personalCategoryId: personalCategory.id,
      trackedCategoryId: selectedTrackedCategory.id,
    });
  };

  return (
    <div className="space-y-3">
      {mappings.length === 0 && (
        <p className="text-muted-foreground text-sm">
          You haven&apos;t connected any of your categories yet
        </p>
      )}

      {mappings.map((mapping) => (
        <div
          aria-label={`${mapping.personal_category.name} maps to ${mapping.tracked_category.name}`}
          className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
          key={mapping.id}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: mapping.personal_category.color }}
            />
            <span className="truncate">{mapping.personal_category.name}</span>
            <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: mapping.tracked_category.color }}
            />
            <span className="truncate">{mapping.tracked_category.name}</span>
          </div>
          <button
            aria-label={`Remove mapping from ${mapping.personal_category.name} to ${mapping.tracked_category.name}`}
            className="text-muted-foreground hover:text-destructive"
            onClick={() => deleteMapping.mutate({ communityId, id: mapping.id })}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      {adding
        ? (
            <Card>
              <CardContent className="p-3 space-y-2">
                <Select
                  onValueChange={(value) => {
                    setSelectedTrackedCategory(
                      trackedCategories.find((tc) => tc.id === value) ?? null,
                    );
                  }}
                  value={selectedTrackedCategory?.id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a tracked category" />
                  </SelectTrigger>
                  <SelectContent>
                    {trackedCategories.map((trackedCategory) => (
                      <SelectItem key={trackedCategory.id} value={trackedCategory.id}>
                        {trackedCategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedTrackedCategory && (
                  <CategoryPicker
                    mode="single"
                    onSelectCategory={handleSelectPersonalCategory}
                  />
                )}

                <Button
                  onClick={() => {
                    setAdding(false);
                    setSelectedTrackedCategory(null);
                  }}
                  size="sm"
                  variant="outline"
                >
                  Done
                </Button>
              </CardContent>
            </Card>
          )
        : (
            <Button
              onClick={() => setAdding(true)}
              size="sm"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Add mapping
            </Button>
          )}
    </div>
  );
};
