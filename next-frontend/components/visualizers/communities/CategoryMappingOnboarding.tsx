"use client";

import type { CategoryWithId } from "@/api/definitions";
import { useCreateMapping } from "@/components/hooks/community/useCreateMapping";
import { useMyMappings } from "@/components/hooks/community/useMyMappings";
import { useTrackedCategories } from "@/components/hooks/community/useTrackedCategories";
import { Button } from "@/components/shadcn/button";
import { Skeleton } from "@/components/shadcn/skeleton";
import { CategoryPicker } from "@/components/visualizers/categories/CategoryPicker";
import type { FC } from "react";

type CategoryMappingOnboardingProps = {
  communityId: string;
  onSkip: () => void;
};

export const CategoryMappingOnboarding: FC<CategoryMappingOnboardingProps> = ({
  communityId,
  onSkip,
}) => {
  const trackedCategoriesQuery = useTrackedCategories(communityId);
  const mappingsQuery = useMyMappings(communityId);
  const createMapping = useCreateMapping();

  if (trackedCategoriesQuery.isPending || mappingsQuery.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const trackedCategories = trackedCategoriesQuery.data ?? [];
  const mappings = mappingsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Connect your own categories to what this community tracks. You can
        change this any time.
      </p>

      {trackedCategories.map((trackedCategory) => {
        const selectedCategories = mappings
          .filter((mapping) => mapping.tracked_category.id === trackedCategory.id)
          .map((mapping) => mapping.personal_category);

        return (
          <div className="space-y-2" key={trackedCategory.id}>
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: trackedCategory.color }}
              />
              <span className="font-medium">{trackedCategory.name}</span>
            </div>
            <CategoryPicker
              mode="multiple"
              onSelectCategory={(category: CategoryWithId) => {
                if (selectedCategories.some((c) => c.id === category.id)) {
                  return;
                }
                createMapping.mutate({
                  communityId,
                  personalCategoryId: category.id,
                  trackedCategoryId: trackedCategory.id,
                });
              }}
              selectedCategories={selectedCategories}
            />
          </div>
        );
      })}

      <Button onClick={onSkip} size="sm" variant="ghost">
        Skip for now
      </Button>
    </div>
  );
};
