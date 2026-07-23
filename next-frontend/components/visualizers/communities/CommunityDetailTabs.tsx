"use client";

import { useMyMappings } from "@/components/hooks/community/useMyMappings";
import { useTrackedCategories } from "@/components/hooks/community/useTrackedCategories";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { CategoryMappingOnboarding } from "@/components/visualizers/communities/CategoryMappingOnboarding";
import { CommunityDashboard } from "@/components/visualizers/communities/CommunityDashboard";
import { MemberList } from "@/components/visualizers/communities/MemberList";
import { MyMappingsList } from "@/components/visualizers/communities/MyMappingsList";
import { TrackedCategoryManager } from "@/components/visualizers/communities/TrackedCategoryManager";
import type { FC } from "react";
import { useState } from "react";

type CommunityDetailTabsProps = {
  communityId: string;
  isOwner: boolean;
};

export const CommunityDetailTabs: FC<CommunityDetailTabsProps> = ({
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
    <Tabs className="w-full" defaultValue="overview">
      <TabsList className="w-full overflow-x-auto sm:w-auto">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <CommunityDashboard communityId={communityId} isOwner={isOwner} />
      </TabsContent>

      <TabsContent value="members">
        <MemberList communityId={communityId} />
      </TabsContent>

      <TabsContent className="space-y-6" value="categories">
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
      </TabsContent>
    </Tabs>
  );
};
