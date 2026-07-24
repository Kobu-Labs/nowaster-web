"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/shadcn/tabs";
import { CommunityCategoriesTab } from "@/components/visualizers/communities/CommunityCategoriesTab";
import { CommunityDashboard } from "@/components/visualizers/communities/CommunityDashboard";
import { MemberList } from "@/components/visualizers/communities/MemberList";
import type { FC } from "react";

type CommunityDetailTabsProps = {
  communityId: string;
  isOwner: boolean;
};

export const CommunityDetailTabs: FC<CommunityDetailTabsProps> = ({
  communityId,
  isOwner,
}) => {
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
        <CommunityCategoriesTab communityId={communityId} isOwner={isOwner} />
      </TabsContent>
    </Tabs>
  );
};
