import { queryKeys } from "@/components/hooks/queryHooks/queryKeys";
import { useQuery } from "@tanstack/react-query";

export const useCommunityMembers = (communityId: string) => {
  return useQuery({
    ...queryKeys.communities.members(communityId),
    enabled: !!communityId,
  });
};
