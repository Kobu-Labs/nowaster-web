"use client";

import { useMyMappings } from "@/components/hooks/community/useMyMappings";
import { useTrackedCategories } from "@/components/hooks/community/useTrackedCategories";
import { CategoryMappingOnboarding } from "@/components/visualizers/communities/CategoryMappingOnboarding";
import { MyMappingsList } from "@/components/visualizers/communities/MyMappingsList";
import { TrackedCategoryManager } from "@/components/visualizers/communities/TrackedCategoryManager";
import type { FC } from "react";
import { useState } from "react";

type CommunityCategoriesTabProps = {
  communityId: string;
  isOwner: boolean;
};

export const CommunityCategoriesTab: FC<CommunityCategoriesTabProps> = ({
  communityId,
  isOwner,
}) => {
  const [onboardingSkipped, setOnboardingSkipped] = useState(false);
  const trackedCategoriesQuery = useTrackedCategories(communityId);
  const mappingsQuery = useMyMappings(communityId);

  const showOnboarding
    = !onboardingSkipped
      && (trackedCategoriesQuery.data?.length ?? 0) > 0
      && mappingsQuery.data?.length === 0;

  return (
    <>
      <div>
        <h3 className="mb-3 font-semibold">Tracked Categories</h3>
        <TrackedCategoryManager communityId={communityId} isOwner={isOwner} />
      </div>

      <div>
        <h3 className="mb-3 font-semibold">My Mappings</h3>
        {showOnboarding
          ? (
              <CategoryMappingOnboarding
                communityId={communityId}
                onSkip={() => setOnboardingSkipped(true)}
              />
            )
          : (
              <MyMappingsList communityId={communityId} />
            )}
      </div>
    </>
  );
};
